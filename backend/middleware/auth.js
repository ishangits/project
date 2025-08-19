import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const authenticateToken = async (req, res, next) => {
try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

if (!token) {
      return res.status(401).json({ message: 'Access token required' });
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password');

if (!admin) {
      return res.status(401).json({ message: 'Invalid token' });
}

req.admin = admin;
next();
} catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
}
};