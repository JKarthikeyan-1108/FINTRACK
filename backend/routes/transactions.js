// routes/transactions.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/transactionController');
const { validate } = require('../middleware/validator');

const txValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('account_id').isString().notEmpty().withMessage('Account ID is required'),
  body('category_id').optional({ nullable: true, checkFalsy: true }).isString(),
  validate
];

router.get ('/',          ctrl.getAll);
router.get ('/summary',   ctrl.summary);
router.post('/',          txValidation, ctrl.create);
router.put ('/:id',       txValidation, ctrl.update);
router.delete('/:id',     ctrl.remove);
module.exports = router;
