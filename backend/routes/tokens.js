import express from 'express';
import { format, subDays } from 'date-fns';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Demo domains
const demoDomains = [
  { id: '1', _id: '1', name: 'Alpha', url: 'alpha.com', domainId: '1' },
  { id: '2', _id: '2', name: 'Beta', url: 'beta.com', domainId: '2' },
  { id: '3', _id: '3', name: 'Gamma', url: 'gamma.com', domainId: '3' },
];

// Generate demo logs
const generateLogs = () => {
  const logs = [];
  for (let i = 0; i < 50; i++) {
    const domain = demoDomains[i % demoDomains.length];
    const date = subDays(new Date(), i % 30).toISOString();
    logs.push({
      id: i + 1,
      domain,
      date,
      tokensUsed: Math.floor(Math.random() * 500) + 50,
      requestType: ['chat', 'kb_update', 'training', 'crawl'][i % 4],
      cost: parseFloat((Math.random() * 5).toFixed(4)),
      metadata: {
        userQuery: `Query ${i + 1}`,
        responseLength: Math.floor(Math.random() * 1000),
        sessionId: `sess_${i + 1}`,
        model: 'gpt-3.5-turbo',
      },
    });
  }
  return logs;
};

// In-memory demo logs
const demoLogs = generateLogs();

// GET token usage with filters
router.get('/', authenticateToken, (req, res) => {
  try {
    let { page = 1, limit = 10, domainId = '', startDate = '', endDate = '', requestType = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let filtered = demoLogs;

    if (domainId) filtered = filtered.filter(log => log.domain.id === domainId);
    if (requestType) filtered = filtered.filter(log => log.requestType === requestType);
    if (startDate) filtered = filtered.filter(log => new Date(log.date) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(log => new Date(log.date) <= new Date(endDate));

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    res.json({
      logs: paginated,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ message: 'Error fetching token usage' });
  }
});

// GET token stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { domainId = '', days = 30 } = req.query;

    // Filter logs for stats
    let filtered = demoLogs.filter(log => new Date(log.date) >= subDays(new Date(), parseInt(days)));
    if (domainId) filtered = filtered.filter(log => log.domain.id === domainId);

    // Total stats
    const totalTokens = filtered.reduce((sum, log) => sum + log.tokensUsed, 0);
    const totalCost = filtered.reduce((sum, log) => sum + log.cost, 0);
    const totalRequests = filtered.length;

    // Daily usage
const dailyMap = {};
    filtered.forEach(log => {
      const day = format(new Date(log.date), 'yyyy-MM-dd');
      if (!dailyMap[day]) dailyMap[day] = { tokens: 0, cost: 0, requests: 0, _id: day, day };
      dailyMap[day].tokens += log.tokensUsed;
      dailyMap[day].cost += log.cost;
      dailyMap[day].requests += 1;
    });

const dailyUsage = Object.values(dailyMap).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

    // Usage by domain
    const domainMap= {};
    filtered.forEach(log => {
      const id = log.domain.id;
      if (!domainMap[id]) domainMap[id] = { _id: id, tokens: 0, cost: 0, requests: 0, domain: { name: log.domain.name }, domainName: log.domain.name };
      domainMap[id].tokens += log.tokensUsed;
      domainMap[id].cost += log.cost;
      domainMap[id].requests += 1;
    });

    const usageByDomain = Object.values(domainMap);

    res.json({
      total: { totalTokens, totalCost, totalRequests },
      dailyUsage,
      usageByDomain,
    });
  } catch (error) {
    console.error('Get token stats error:', error);
    res.status(500).json({ message: 'Error fetching token statistics' });
  }
});

// Create token usage log (demo)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { domainId, tokensUsed, requestType = 'chat', metadata = {} } = req.body;

    if (!domainId || !tokensUsed) return res.status(400).json({ message: 'Domain ID and tokens used are required' });

    const domain = demoDomains.find(d => d.id === domainId) || { id: domainId, _id: domainId, name: 'Unknown', url: 'unknown.com', domainId };
    const log = {
      id: demoLogs.length + 1,
      domain,
      date: new Date().toISOString(),
      tokensUsed,
      requestType,
      cost: parseFloat((Math.random() * 5).toFixed(4)),
      metadata,
    };

    demoLogs.unshift(log); // Add to top
    res.status(201).json(log);
  } catch (error) {
    console.error('Create token log error:', error);
    res.status(500).json({ message: 'Error creating token usage log' });
  }
});

export default router;
