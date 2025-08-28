import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Decode external token (without verifying signature)
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Attach payload to req.admin
    req.admin = {
      id: decoded.id || decoded.adminId,
      email: decoded.email,
      role: decoded.role || 'super-admin', // fallback if role not in token
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

