// middleware/auth.js — protect routes with JWT
const { verifyAccessToken } = require('../config/jwt');
const db = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Optionally verify user still exists & is active
    const [rows] = await db.query(
      'SELECT id, uuid, name, email, phone, is_active FROM users WHERE uuid = ?',
      [decoded.sub]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    req.user = { ...rows[0], ...decoded };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
    }
    next(err);
  }
}

module.exports = { authenticate };
