// controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db     = require('../config/db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../config/jwt');

// ── helpers ────────────────────────────────────────────
const isDemoOTP = process.env.DEMO_OTP === 'true';
const DEMO_CODE  = process.env.DEMO_OTP_CODE || '742819';

function generateOTP() {
  return isDemoOTP ? DEMO_CODE : String(Math.floor(100000 + Math.random() * 900000));
}

async function sendRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/api/auth/refresh',
  });
}

async function storeRefreshToken(userId, token) {
  const hash    = hashToken(token);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)',
    [userId, hash, expires]
  );
}

// ── SEND OTP ───────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    const otp     = generateOTP();
    const hash    = await bcrypt.hash(otp, 8);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.query(
      `INSERT INTO otp_records (phone, otp_hash, expires_at)
       VALUES (?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET otp_hash=excluded.otp_hash, expires_at=excluded.expires_at,
       verified=0, attempts=0`,
      [phone, hash, expires]
    );

    console.log(`📱  OTP for ${phone}: ${otp} (demo mode: ${isDemoOTP})`);

    res.json({
      success: true,
      message: 'OTP sent',
      ...(isDemoOTP && { demo_otp: otp }),
    });
  } catch (err) { next(err); }
};

// ── VERIFY OTP & LOGIN ─────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const [records] = await db.query(
      `SELECT * FROM otp_records
       WHERE phone = ? AND verified = 0 AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`,
      [phone, new Date()]
    );

    if (!records.length) {
      return res.status(400).json({ error: 'OTP expired or not found. Request a new one.' });
    }

    const record = records[0];
    if (record.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
    }

    const valid = await bcrypt.compare(otp, record.otp_hash);
    if (!valid) {
      await db.query('UPDATE otp_records SET attempts=attempts+1 WHERE id=?', [record.id]);
      return res.status(400).json({ error: 'Invalid OTP', attempts_left: 5 - record.attempts - 1 });
    }

    await db.query('UPDATE otp_records SET verified=TRUE WHERE id=?', [record.id]);

    // Upsert user
    let [users] = await db.query('SELECT * FROM users WHERE phone=?', [phone]);
    let user;
    if (!users.length) {
      const [result] = await db.query(
        'INSERT INTO users (name, phone, auth_method) VALUES (?,?,?)',
        [`User_${phone.slice(-4)}`, phone, 'phone']
      );
      [users] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
      // Create default account
      await db.query(
        'INSERT INTO accounts (user_id, name, type, is_default) VALUES (?,?,?,?)',
        [result.insertId, 'Primary Account', 'savings', true]
      );
    }
    user = users[0];

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);
    await sendRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      user: { uuid: user.uuid, name: user.name, phone: user.phone, auth_method: user.auth_method },
      access_token: accessToken,
      token_type:   'Bearer',
      expires_in:   1800,
    });
  } catch (err) { next(err); }
};

// ── GOOGLE LOGIN (demo mode) ───────────────────────────
exports.googleLogin = async (req, res, next) => {
  try {
    // In production: validate req.body.id_token with Google OAuth2 client
    // For demo, we accept a fake payload
    const { name, email, google_id, avatar_url } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({ error: 'name, email, google_id required' });
    }

    let [users] = await db.query('SELECT * FROM users WHERE email=? OR google_id=?', [email, google_id]);
    let user;
    if (!users.length) {
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id, avatar_url, auth_method) VALUES (?,?,?,?,?)',
        [name, email, google_id, avatar_url || null, 'google']
      );
      [users] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
      await db.query(
        'INSERT INTO accounts (user_id, name, type, is_default) VALUES (?,?,?,?)',
        [result.insertId, 'Primary Account', 'savings', true]
      );
    }
    user = users[0];

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);
    await sendRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      user: { uuid: user.uuid, name: user.name, email: user.email, auth_method: user.auth_method },
      access_token: accessToken,
      token_type:   'Bearer',
      expires_in:   1800,
    });
  } catch (err) { next(err); }
};

// ── REFRESH TOKEN ──────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refresh_token;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'REFRESH_EXPIRED' }); }

    const hash = hashToken(token);
    const [records] = await db.query(
      `SELECT rt.*, u.uuid, u.name, u.email, u.phone, u.auth_method
       FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
       WHERE rt.user_id=? AND rt.token_hash=? AND rt.revoked=0 AND rt.expires_at > ?`,
      [decoded.sub, hash, new Date()]
    );

    if (!records.length) return res.status(401).json({ error: 'Refresh token revoked or expired' });

    const user = records[0];

    // Rotate: revoke old, issue new
    await db.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=?', [hash]);
    const newAccessToken  = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user.user_id);
    await storeRefreshToken(user.user_id, newRefreshToken);
    await sendRefreshCookie(res, newRefreshToken);

    res.json({
      access_token: newAccessToken,
      token_type:   'Bearer',
      expires_in:   1800,
    });
  } catch (err) { next(err); }
};

// ── LOGOUT ─────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refresh_token;
    if (token) {
      const hash = hashToken(token);
      await db.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=?', [hash]);
    }
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

// ── CURRENT USER ───────────────────────────────────────
exports.me = async (req, res) => {
  const [rows] = await db.query(
    'SELECT uuid, name, email, phone, auth_method, avatar_url, currency, created_at FROM users WHERE id=?',
    [req.user.id]
  );
  res.json({ user: rows[0] });
};

// ── EMAIL REGISTER ─────────────────────────────────────
exports.emailRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });

    const [existing] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, auth_method) VALUES (?,?,?,?)',
      [name, email, hash, 'email']
    );
    await db.query(
      'INSERT INTO accounts (user_id, name, type, is_default) VALUES (?,?,?,?)',
      [result.insertId, 'Primary Account', 'savings', true]
    );
    const [users] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    const user = users[0];

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);
    await sendRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      user: { uuid: user.uuid, name: user.name, email: user.email, auth_method: user.auth_method },
      access_token: accessToken, token_type: 'Bearer', expires_in: 1800,
    });
  } catch(err){ next(err); }
};

// ── EMAIL LOGIN ────────────────────────────────────────
exports.emailLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [users] = await db.query('SELECT * FROM users WHERE email=? AND auth_method="email"', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);
    await sendRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      user: { uuid: user.uuid, name: user.name, email: user.email, auth_method: user.auth_method },
      access_token: accessToken, token_type: 'Bearer', expires_in: 1800,
    });
  } catch(err){ next(err); }
};
