import express from 'express';
import { Op } from 'sequelize';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { maskKey } from '../utils/mask.js';
import axios from 'axios';
const router = express.Router();


router.post('/', authenticateToken, async (req, res) => {
  console.log('[TRAIN] Route hit');
  console.log('[TRAIN] Body:', req.body);

  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ message: 'tenantId is required' });

  // Use the tenantId from frontend directly
  const payload = { tenantId };
  console.log('[TRAIN] Sending to external API:', payload);

  try {
    const response = await axios.post(
      `${process.env.TENANT_API_BASE}/api/admin/ingest/all/`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TENANT_API_KEY || '',
        },
      }
    );

    console.log('[TRAIN] External API response:', response.data);
    res.json({ message: 'Training started successfully', data: response.data });

  } catch (err) {
    console.error('[TRAIN] External API error:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Failed to start training',
      details: err.response?.data || err.message,
    });
  }
});

export default router;



