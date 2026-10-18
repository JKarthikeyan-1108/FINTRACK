// controllers/authController.js
// Sign-in, sign-up, Google, password reset and sessions are handled by Firebase Auth on the client.
// The backend only exposes the signed-in user's profile (stored in Firestore: users/{uid}).
const { auth } = require('../config/firebase');
const db    = require('../config/db');
const { deleteUserData } = require('../utils/firestoreHelpers');

function publicProfile(p) {
  return {
    uuid:        p.uuid,
    name:        p.name,
    email:       p.email || null,
    phone:       p.phone || null,
    auth_method: p.auth_method,
    avatar_url:  p.avatar_url || null,
    currency:    p.currency || 'INR',
    date_format: p.date_format || 'en-IN',
    created_at:  p.created_at,
  };
}

// ── CURRENT USER ───────────────────────────────────────
// The auth middleware has already created the profile on first sign-in.
exports.me = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicProfile(snap.data()) });
  } catch (err) { next(err); }
};

// ── UPDATE PROFILE ────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, currency, date_format } = req.body;
    const updates = {};

    if (name && name.trim()) updates.name = name.trim();
    if (currency)            updates.currency = currency;
    if (date_format)         updates.date_format = date_format;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    updates.updated_at = new Date();

    const ref = db.collection('users').doc(req.user.id);
    await ref.update(updates);

    // Keep the Firebase Auth display name in sync
    if (updates.name) {
      await auth().updateUser(req.user.id, { displayName: updates.name });
    }

    const snap = await ref.get();
    res.json({ success: true, user: publicProfile(snap.data()) });
  } catch (err) { next(err); }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const confirm = String(req.body?.confirm || '').trim();
    if (confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Type DELETE to confirm account deletion' });
    }
    await deleteUserData(uid);
    try {
      await auth().deleteUser(uid);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};
