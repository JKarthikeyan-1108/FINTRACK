// routes/investments.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/investmentController');
const { validate } = require('../middleware/validator');

const investmentValidation = [
  body('invested_amount').isFloat({ min: 0 }).withMessage('Invested amount must be >= 0'),
  body('current_value').isFloat({ min: 0 }).withMessage('Current value must be >= 0'),
  validate
];

router.get   ('/',    ctrl.getAll);
router.post  ('/',    investmentValidation, ctrl.create);
router.put   ('/:id', investmentValidation, ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
