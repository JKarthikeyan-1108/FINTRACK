// routes/investments.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/investmentController');
const { validate } = require('../middleware/validator');

const investmentCreate = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('invested_amount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('current_value').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  validate
];

const investmentUpdate = [
  body('invested_amount').optional().isFloat({ min: 0 }),
  body('current_value').optional().isFloat({ min: 0 }),
  validate
];

router.get   ('/',    ctrl.getAll);
router.post  ('/',    investmentCreate, ctrl.create);
router.put   ('/:id', investmentUpdate, ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
