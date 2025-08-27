// routes/domains.js
import express from 'express';
import { Op } from 'sequelize';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { maskKey } from '../utils/mask.js';
import axios from 'axios';


const router = express.Router();

// ✅ Get all domains with pagination + search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // Call external tenants API
    const response = await axios.get('http://65.2.3.52:3000/api/tenants', {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TENANT_API_KEY
      }
    });

    // ✅ Extract tenants array
    let domains = response.data.tenants || [];

    // Filter by search (name, domain, dbName, etc.)
    let filtered = domains.filter(domain => {
      const searchLower = search.toLowerCase();
      return (
        (domain.name && domain.name.toLowerCase().includes(searchLower)) ||
        (domain.domain && domain.domain.toLowerCase().includes(searchLower)) ||
        (domain.dbName && domain.dbName.toLowerCase().includes(searchLower))
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      if (sortOrder.toUpperCase() === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const paginated = filtered.slice(offset, offset + parseInt(limit));

    // ✅ Normalize response for frontend
   // ✅ Normalize response for frontend
const normalized = paginated.map((d, idx) => ({
  id: d.id || idx + 1,
  name: d.name,
  url: d.domain,
  openAIKey: d.openai_api_key || "",   // map correctly
  domainId: d.domainId || d.id || idx + 1,
  apiEndpoint: d.apiEndpoint || `${d.domain}/api`, // fallback
  authToken: d.authToken || "",

  // 🔹 DB fields
  dbHost: d.dbIP || "",
  dbPort: d.dbPort || "",
  dbUser: d.dbUserName || "",
  dbPassword: d.dbPass || "",
  dbDatabase: d.dbName || "",

  // 🔹 Extra / frontend-required fields
  kbSettings: d.kbSettings || { lastUpdated: null, autoUpdate: false },
  status: d.status || "active",
  createdAt: d.createdAt || new Date().toISOString(),
}));



    res.json({
      domains: normalized,
      totalPages: Math.ceil(filtered.length / limit),
      currentPage: parseInt(page),
      total: filtered.length,
    });
  } catch (error) {
    console.error('Get domains error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching domains', error: error.message });
  }
});



// ✅ Get domain by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });
    res.json(domain);
  } catch (error) {
    console.error('Get domain error:', error);
    res.status(500).json({ message: 'Error fetching domain' });
  }
});


// ✅ Create new domain (only external API, no local DB save)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url, openAIKey, dbHost, dbUser, dbPassword, dbDatabase, dbPort } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });

    // 🔹 1. Call external tenant API
    const externalResp = await axios.post(
      `${process.env.TENANT_API_BASE}/api/tenants/`,
      {
        name,
        domain: url,
        apiKey: openAIKey || '',
        dbIP: dbHost,
        dbUserName: dbUser,
        dbName: dbDatabase,
        dbPass: dbPassword,
        dbPort
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TENANT_API_KEY
        }
      }
    );

    // 🔹 Log full external API response
    console.log("External Tenant API Response:", {
      status: externalResp.status,
      headers: externalResp.headers,
      data: externalResp.data
    });

    if (!externalResp.data.success) {
      return res.status(400).json({
        message: 'External tenant creation failed',
        details: externalResp.data
      });
    }

    // 🔹 2. Just return external API response (no DB save)
    res.status(201).json({
      message: 'Domain created successfully (external only)',
      tenantId: externalResp.data.tenantId,
      external: externalResp.data
    });

  } catch (error) {
    console.error('Create domain error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error creating domain',
      details: error.response?.data || error.message
    });
  }
});

// Update tenant via external API only
// Update tenant using ID from body
router.put('/:id', async (req, res) => {
  try {
    console.log('[UPDATE TENANT] Original Request Body:', req.body);

    const { id } = req.params;
    const domainData = req.body;

    const externalPayload = {
      id: domainData.id,       // original frontend id
      name: domainData.name,
      domain: domainData.domain,
      apiKey: domainData.apiKey,
      dbIP: domainData.dbIP,
      dbUserName: domainData.dbUserName,
      dbName: domainData.dbName,
      dbPass: domainData.dbPass,
      dbPort: domainData.dbPort
    };

    console.log('[UPDATE TENANT] External API Request Body:', externalPayload);

    const externalResp = await axios.post(
      'http://65.2.3.52:3000/api/tenants/update-tenant',
      externalPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TENANT_API_KEY
        }
      }
    );

    console.log('[UPDATE TENANT] External API Response:', externalResp.data);

    res.json({
      message: 'Tenant updated successfully (external API)',
      external: externalResp.data
    });

  } catch (error) {
    console.error('[UPDATE TENANT] External API error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to update tenant',
      details: error.response?.data || error.message
    });
  }
});





// ✅ Delete domain
// DELETE /domains/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params; // ✅ get id
    const deleted = await Domain.destroy({
      where: { id }, // ✅ match by custom id
    });

    if (deleted) {
      return res.json({ message: 'Domain deleted successfully' });
    }

    res.status(404).json({ error: 'Domain not found' });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

router.post('/:id/reveal-key', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    // Decrypted key via model getter
    const decryptedKey = domain.openAIKey;
    res.json({ openAIKey: decryptedKey });
  } catch (err) {
    console.error('Error revealing key:', err);
    res.status(500).json({ message: 'Failed to reveal key' });
  }
});


// ✅ Update KB timestamp
router.post('/:id/kb-update', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    await domain.update({
      kbSettings: { ...domain.kbSettings, lastUpdated: new Date() },
    });

    res.json({ message: 'KB updated successfully', domain });
  } catch (error) {
    console.error('KB update error:', error);
    res.status(500).json({ message: 'Error updating KB' });
  }
});

export default router;
