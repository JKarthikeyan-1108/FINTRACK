// middleware/auth.js — protect routes with Firebase ID tokens
const { auth } = require('../config/firebase');
const { ensureUser } = require('../utils/firestoreHelpers');

async function authenticate(req, res, next) {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];

    let decoded;
    try {
      decoded = await auth().verifyIdToken(token);
    } catch (err) {
      if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
    }

    // First sign-in → create profile + default account
    const profile = await ensureUser(decoded);
    if (profile.is_active === false) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    // `id` is the Firebase UID — every controller scopes its queries by req.user.id
    req.user = {
      id:    decoded.uid,
      uuid:  decoded.uid,
      name:  profile.name,
      email: profile.email || decoded.email || null,
      phone: profile.phone || decoded.phone_number || null,
      is_active: true,
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
