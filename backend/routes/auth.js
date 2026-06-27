const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/send-otp',    c.sendOTP);
router.post('/verify-otp',  c.verifyOTP);
router.post('/google',      c.googleLogin);
router.post('/email/login', c.emailLogin);
router.post('/email/register', c.emailRegister);
router.post('/refresh',     c.refresh);
router.post('/logout',      c.logout);
router.get('/me',           authenticate, c.me);
module.exports = router;
