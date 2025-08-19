import express from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all domains with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { url: { [Op.like]: `%${search}%` } },
            { domainId: { [Op.like]: `%${search}%` } },
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

// Get domain by ID
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

// Create new domain
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });

    const domainId = crypto.randomUUID();
    const apiEndpoint = `/api/chat/${domainId}`;
    const authToken = crypto.randomBytes(32).toString('hex');

    const domain = await Domain.create({
      name,
      url,
      domainId,
      apiEndpoint,
      authToken,
      status: 'active',
    });

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
    const domain = await Domain.findByPk(req.params.id);

    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    await domain.update({
      name,
      url,
      status,
      ...(kbSettings && { kbSettings }),
      updatedAt: new Date(),
    });

    res.json(domain);
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({ message: 'Error updating domain' });
  }
});

// Delete domain
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    await TokenUsageLog.destroy({ where: { domainId: domain.id } });
    await domain.destroy();

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ message: 'Error deleting domain' });
  }
});

// Update KB timestamp
router.post('/:id/kb-update', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    await domain.update({
      kbSettings: { ...domain.kbSettings, lastUpdated: new Date() },
      updatedAt: new Date(),
    });

    res.json({ message: 'KB updated successfully', domain });
  } catch (error) {
    console.error('KB update error:', error);
    res.status(500).json({ message: 'Error updating KB' });
  }
});

export default router;
