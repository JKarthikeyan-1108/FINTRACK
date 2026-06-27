// routes/transactions.js
const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
router.get ('/',          ctrl.getAll);
router.get ('/summary',   ctrl.summary);
router.post('/',          ctrl.create);
router.put ('/:id',       ctrl.update);
router.delete('/:id',     ctrl.remove);
module.exports = router;
