import express from 'express';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';


const router = express.Router();

// Get all domains with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = search 
      ? { 
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { url: { $regex: search, $options: 'i' } },
            { domainId: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const domains = await Domain.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Domain.countDocuments(query);

    res.json({
      domains,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({ message: 'Error fetching domains' });
  }
});

// Get domain by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    res.json(domain);
  } catch (error) {
    console.error('Get domain error:', error);
    res.status(500).json({ message: 'Error fetching domain' });
  }
});



// Create new domain
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: 'Name and URL are required' });
    }

    const domainId = crypto.randomUUID(); // Unique ID for the domain
    const apiEndpoint = `/api/chat/${domainId}`; // API endpoint for this domain
    const authToken = crypto.randomBytes(32).toString('hex'); // Secret auth token

    const domain = new Domain({
      name,
      url,
      domainId,
      apiEndpoint,
      authToken,
      status: 'active' // default active
    });

    await domain.save();

    res.status(201).json(domain);
  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({ message: 'Error creating domain' });
  }
});


// Update domain
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, url, status, kbSettings } = req.body;
    
    const updateData = { name, url, status };
    if (kbSettings) {
      updateData.kbSettings = kbSettings;
    }

    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    res.json(domain);
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({ message: 'Error updating domain' });
  }
});

// Delete domain
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByIdAndDelete(req.params.id);
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    // Also delete related token usage logs
    await TokenUsageLog.deleteMany({ domainId: req.params.id });

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ message: 'Error deleting domain' });
  }
});

// Update KB timestamp
router.post('/:id/kb-update', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      { 
        'kbSettings.lastUpdated': new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    res.json({ message: 'KB updated successfully', domain });
  } catch (error) {
    console.error('KB update error:', error);
    res.status(500).json({ message: 'Error updating KB' });
  }
});

export default router;