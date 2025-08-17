import express from 'express';
import TokenUsageLog from '../models/TokenUsageLog.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get token usage with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      domainId = '', 
      startDate = '', 
      endDate = '', 
      requestType = '' 
    } = req.query;

    const query = {};
    
    if (domainId) {
      query.domainId = domainId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (requestType) {
      query.requestType = requestType;
    }

    const logs = await TokenUsageLog.find(query)
      .populate('domainId', 'name url domainId')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TokenUsageLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ message: 'Error fetching token usage' });
  }
});

// Get token usage statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { domainId = '', days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const matchQuery = {
      date: { $gte: startDate }
    };
    
    if (domainId) {
      matchQuery.domainId = domainId;
    }

    // Total usage
    const totalStats = await TokenUsageLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    // Daily usage for chart
    const dailyUsage = await TokenUsageLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          tokens: { $sum: '$tokensUsed' },
          cost: { $sum: '$cost' },
          requests: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Usage by domain
    const usageByDomain = await TokenUsageLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$domainId',
          tokens: { $sum: '$tokensUsed' },
          cost: { $sum: '$cost' },
          requests: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'domains',
          localField: '_id',
          foreignField: '_id',
          as: 'domain'
        }
      },
      {
        $project: {
          tokens: 1,
          cost: 1,
          requests: 1,
          domainName: { $arrayElemAt: ['$domain.name', 0] }
        }
      },
      { $sort: { tokens: -1 } }
    ]);

    res.json({
      total: totalStats[0] || { totalTokens: 0, totalCost: 0, totalRequests: 0 },
      dailyUsage,
      usageByDomain
    });
  } catch (error) {
    console.error('Get token stats error:', error);
    res.status(500).json({ message: 'Error fetching token statistics' });
  }
});

// Create token usage log (for simulation/testing)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { domainId, tokensUsed, requestType = 'chat', metadata = {} } = req.body;

    if (!domainId || !tokensUsed) {
      return res.status(400).json({ message: 'Domain ID and tokens used are required' });
    }

    const log = new TokenUsageLog({
      domainId,
      tokensUsed,
      requestType,
      metadata
    });

    await log.save();
    res.status(201).json(log);
  } catch (error) {
    console.error('Create token log error:', error);
    res.status(500).json({ message: 'Error creating token usage log' });
  }
});

export default router;