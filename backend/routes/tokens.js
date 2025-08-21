import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import TokenUsageLog from '../models/TokenUsageLog.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get token usage with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, domainId = '', startDate = '', endDate = '', requestType = '' } = req.query;

    const where = {};
    if (domainId) where.domainId = domainId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    if (requestType) where.requestType = requestType;

   const logs = await TokenUsageLog.findAll({
  where,
  include: [{ model: Domain, as: 'domain', attributes: ['name', 'id', 'url'] }],
  order: [['date', 'DESC']],
  limit: parseInt(limit),
  offset: (page - 1) * limit
});

    const total = await TokenUsageLog.count({ where });

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ message: 'Error fetching token usage' });
  }
});

// Get token usage statistics
// Get token usage statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { domainId = '', days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = { date: { [Op.gte]: startDate } };
    if (domainId) where.domainId = domainId;

    // Total usage
    const totalStats = await TokenUsageLog.findOne({
      attributes: [
        [fn('SUM', col('TokenUsageLog.tokensUsed')), 'totalTokens'],
        [fn('SUM', col('TokenUsageLog.cost')), 'totalCost'],
        [fn('COUNT', col('TokenUsageLog.id')), 'totalRequests'] // fully qualified
      ],
      where
    });

    // Daily usage for chart
    const dailyUsage = await TokenUsageLog.findAll({
      attributes: [
        [fn('DATE', col('TokenUsageLog.date')), 'day'],
        [fn('SUM', col('TokenUsageLog.tokensUsed')), 'tokens'],
        [fn('SUM', col('TokenUsageLog.cost')), 'cost'],
        [fn('COUNT', col('TokenUsageLog.id')), 'requests'] // fully qualified
      ],
      where,
      group: [literal('DATE(`TokenUsageLog`.`date`)')],
      order: [[literal('DATE(`TokenUsageLog`.`date`)'), 'ASC']]
    });

    // Usage by domain
    const usageByDomain = await TokenUsageLog.findAll({
      attributes: [
        'domainId',
        [fn('SUM', col('TokenUsageLog.tokensUsed')), 'tokens'],
        [fn('SUM', col('TokenUsageLog.cost')), 'cost'],
        [fn('COUNT', col('TokenUsageLog.id')), 'requests'] // fully qualified
      ],
      where,
      include: [{ model: Domain, as: 'domain', attributes: ['name'] }],
      group: ['TokenUsageLog.domainId', 'domain.id'],
      order: [[fn('SUM', col('TokenUsageLog.tokensUsed')), 'DESC']]
    });

    res.json({
      total: totalStats || { totalTokens: 0, totalCost: 0, totalRequests: 0 },
      dailyUsage,
      usageByDomain
    });
  } catch (error) {
    console.error('Get token stats error:', error);
    res.status(500).json({ message: 'Error fetching token statistics' });
  }
});


// Create token usage log (simulation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { domainId, tokensUsed, requestType = 'chat', metadata = {} } = req.body;

    if (!domainId || !tokensUsed) {
      return res.status(400).json({ message: 'Domain ID and tokens used are required' });
    }

    const log = await TokenUsageLog.create({
      domainId,
      tokensUsed,
      requestType,
      metadata
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create token log error:', error);
    res.status(500).json({ message: 'Error creating token usage log' });
  }
});

export default router;
