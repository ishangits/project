import express from 'express';
import jwt from 'jsonwebtoken';
// import Admin from '../models/Admin.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from "axios";
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Forward credentials to external tenant service
    const response = await axios.post(
      `${process.env.TENANT_API_BASE}/api/admin/admin-login/`,
      { email, password },
      {
        headers: { 
          'X-API-Key': process.env.TENANT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Just return whatever external API sends (usually token + admin info)
    res.json(response.data);

  } catch (error) {
    console.error('External login failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Login failed' }
    );
  }
});


// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ admin: req.admin });
});

// Logout (client-side token removal, optionally log it)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});
// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const response = await axios.post(
      `${process.env.TENANT_API_BASE}/api/admin/change-password/`,
      { oldPassword: currentPassword, newPassword },
      {
        headers: {
          'Authorization': `Basic ${process.env.TENANT_API_KEY}`, // tenant key
          'token': req.headers['authorization']?.split(' ')[1],   // JWT from client
          'Content-Type': 'application/json'
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('External change-password failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Change password failed' }
    );
  }
});


export default router;
