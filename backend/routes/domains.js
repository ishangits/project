// routes/domains.js
import express from 'express';
import { Op } from 'sequelize';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ Get all domains with pagination + search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { url: { [Op.like]: `%${search}%` } },
            { id: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows: domains, count: total } = await Domain.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      domains,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({ message: 'Error fetching domains' });
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

// ✅ Create new domain
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url, openAIKey } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });

    const domain = await Domain.create({ name, url, openAIKey });
    res.status(201).json(domain);
  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({ message: 'Error creating domain' });
  }
});

// ✅ Update domain
// PUT /domains/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params; // ✅ get id from params
    const [updated] = await Domain.update(req.body, {
      where: { id }, // ✅ use your custom id
    });

    if (updated) {
      const updatedDomain = await Domain.findOne({ where: { id } });
      return res.json(updatedDomain);
    }

    res.status(404).json({ error: 'Domain not found' });
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
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
