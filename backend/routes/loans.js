const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/loanController');
const { validate } = require('../middleware/validator');

const loanCreate = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('principal').isFloat({ gt: 0 }).withMessage('Principal must be > 0'),
  body('interest_rate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Interest rate must be >= 0'),
  body('remaining').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Remaining must be >= 0'),
  body('tenure_months').isInt({ gt: 0, max: 600 }).withMessage('Tenure months must be > 0'),
  validate,
];

const loanUpdate = [
  body('remaining').optional().isFloat({ min: 0 }),
  body('paid_months').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
  body('interest_rate').optional().isFloat({ min: 0 }),
  body('tenure_months').optional().isInt({ gt: 0, max: 600 }),
  validate,
];

router.get('/', c.getAll);
router.post('/', loanCreate, c.create);
router.post('/:id/pay', c.payEmi);
router.put('/:id', loanUpdate, c.update);
router.delete('/:id', c.remove);
module.exports = router;
