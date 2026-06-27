// routes/dashboard.js
const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
router.get('/overview', ctrl.overview);
router.get('/trends',   ctrl.trends);
module.exports = router;
