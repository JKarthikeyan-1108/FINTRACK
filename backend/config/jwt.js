// config/jwt.js — JWT sign, verify, refresh helpers
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXP     = process.env.JWT_EXPIRES_IN     || '30m';
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an access token
 */
function signAccessToken(payload) {
  return jwt.sign(
    {
      sub:    payload.uuid,
      name:   payload.name,
      email:  payload.email  || null,
      phone:  payload.phone  || null,
      method: payload.auth_method,
      role:   'user',
      scope:  'fintrack:read fintrack:write',
    },
    ACCESS_SECRET,
    {
      algorithm:  'HS256',
      expiresIn:  ACCESS_EXP,
      issuer:     'fintrack-api',
      audience:   'fintrack-app',
      jwtid:      crypto.randomUUID(),
    }
  );
}

/**
 * Sign a refresh token
 */
function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: REFRESH_EXP, issuer: 'fintrack-api' }
  );
}

/**
 * Verify an access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer:     'fintrack-api',
    audience:   'fintrack-app',
  });
}

/**
 * Verify a refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, {
    algorithms: ['HS256'],
    issuer:     'fintrack-api',
  });
}

/**
 * Decode without verification (for inspecting expired tokens)
 */
function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * Hash a refresh token for DB storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  hashToken,
};
