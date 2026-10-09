const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/recurringController');
const { validate } = require('../middleware/validator');

const recurringValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Valid frequency required'),
  body('next_run').isISO8601().withMessage('Next run date is required'),
  body('account_id').isString().notEmpty().withMessage('Account ID is required'),
  validate
];

router.get   ('/',    ctrl.getAll);
router.post  ('/',    recurringValidation, ctrl.create);
router.put   ('/:id', recurringValidation, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
