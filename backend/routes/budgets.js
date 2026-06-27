// routes/budgets.js
const router = require('express').Router();
const ctrl = require('../controllers/budgetController');
router.get   ('/',    ctrl.getAll);
router.post  ('/',    ctrl.create);
router.put   ('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
