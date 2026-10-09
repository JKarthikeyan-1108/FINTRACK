const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Login, registration, Google sign-in and password reset are handled by Firebase Auth.
// These routes only expose the signed-in user's Firestore profile.
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateProfile);

module.exports = router;
