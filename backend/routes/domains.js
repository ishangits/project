// routes/domains.js
import express from 'express';
// import { Op } from 'sequelize';
// import Domain from '../models/Domain.js';
// import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { maskKey } from '../utils/mask.js';
import axios from 'axios';


const router = express.Router();
// /api/tenants

// ✅ Get all domains with pagination + search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // External tenants API
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
  let aVal = a[sortBy];
  let bVal = b[sortBy];

  if (sortBy === 'createdAt') {
    aVal = aVal ? new Date(aVal).getTime() : 0;
    bVal = bVal ? new Date(bVal).getTime() : 0;
  } else {
    aVal = aVal || '';
    bVal = bVal || '';
  }

  if (sortOrder.toUpperCase() === 'ASC') {
    return aVal > bVal ? 1 : -1;
  } else {
    return aVal < bVal ? 1 : -1;
  }
});


    // Pagination
    const paginated = filtered.slice(offset, offset + parseInt(limit));

   // ✅ Normalize response for frontend
const normalized = paginated.map((d, idx) => ({
  
  id: d.id || idx + 1,
  name: d.name,
  url: d.domain,
  openAIKey: d.openai_api_key || "",
  domainId: d.domainId || d.id || idx + 1,
  apiEndpoint: d.apiEndpoint || `${d.domain}/api`, 
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
// router.get('/:id', authenticateToken, async (req, res) => {
//   try {
//     const domain = await Domain.findByPk(req.params.id);
//     if (!domain) return res.status(404).json({ message: 'Domain not found' });
//     res.json(domain);
//   } catch (error) {
//     console.error('Get domain error:', error);
//     res.status(500).json({ message: 'Error fetching domain' });
//   }
// });


// ✅ Create new domain (only external API, no local DB save)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url, openAIKey, dbHost, dbUser, dbPassword, dbDatabase, dbPort } = req.body;
    console.log(`[CREATE DOMAIN] Request received:`, req.body); // <-- log input

    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });

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

    console.log(`[CREATE DOMAIN] External API response:`, externalResp.data);

    if (!externalResp.data.success) {
      console.log(`[CREATE DOMAIN] External API failed`, externalResp.data);
      return res.status(400).json({
        message: 'External tenant creation failed',
        details: externalResp.data
      });
    }

    console.log(`[CREATE DOMAIN] Domain created successfully: tenantId=${externalResp.data.tenantId}`);
    res.status(201).json({
      message: 'Domain created successfully (external only)',
      tenantId: externalResp.data.tenantId,
      external: externalResp.data
    });

  } catch (error) {
    console.error('[CREATE DOMAIN] Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error creating domain',
      details: error.response?.data || error.message
    });
  }
});


// Update tenant via external API only
router.post("/update", authenticateToken, async (req, res) => {
  try {
    const {
      id,
      name,
      url,
      status,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbDatabase,
      apiKey
    } = req.body;

    if (!id) return res.status(400).json({ error: "tenantId is required" });

    // Build payload matching the exact API structure
    const payload = {
      id,
      name: name || "",
      domain: url || "",
      apiKey: apiKey || "",
      dbIP: dbHost || "",
      dbUserName: dbUser || "",
      dbName: dbDatabase || "",
      dbPass: dbPassword || "",
      dbPort: dbPort ? String(dbPort) : "",
      status: status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Active"
    };

    // Log each field
    console.log("[UPDATE DOMAIN] Payload fields:");
    Object.entries(payload).forEach(([key, value]) => {
      console.log(`[UPDATE DOMAIN] ${key}:`, value);
    });

    const response = await axios.post(
      `${process.env.TENANT_API_BASE}/api/tenants/update-tenant`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TENANT_API_KEY
        }
      }
    );

    console.log("[UPDATE DOMAIN] External API response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("[UPDATE DOMAIN] Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to update domain" });
  }
});

// DELETE /domains/:id
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params; // ✅ get id
//     const deleted = await Domain.destroy({
//       where: { id }, // ✅ match by custom id
//     });

//     if (deleted) {
//       return res.json({ message: 'Domain deleted successfully' });
//     }

//     res.status(404).json({ error: 'Domain not found' });
//   } catch (error) {
//     console.error('Error deleting domain:', error);
//     res.status(500).json({ error: 'Failed to delete domain' });
//   }
// });

// router.post('/:id/reveal-key', authenticateToken, async (req, res) => {
//   try {
//     const domain = await Domain.findByPk(req.params.id);
//     if (!domain) return res.status(404).json({ message: 'Domain not found' });

//     // Decrypted key via model getter
//     const decryptedKey = domain.openAIKey;
//     res.json({ openAIKey: decryptedKey });
//   } catch (err) {
//     console.error('Error revealing key:', err);
//     res.status(500).json({ message: 'Failed to reveal key' });
//   }
// });


// ✅ Update KB timestamp
// router.post('/:id/kb-update', authenticateToken, async (req, res) => {
//   try {
//     const domain = await Domain.findByPk(req.params.id);
//     if (!domain) return res.status(404).json({ message: 'Domain not found' });

//     await domain.update({
//       kbSettings: { ...domain.kbSettings, lastUpdated: new Date() },
//     });

//     res.json({ message: 'KB updated successfully', domain });
//   } catch (error) {
//     console.error('KB update error:', error);
//     res.status(500).json({ message: 'Error updating KB' });
//   }
// });

export default router;
