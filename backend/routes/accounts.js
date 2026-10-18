const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/accountController');
const { validate } = require('../middleware/validator');

const ACCOUNT_TYPES = ['savings', 'current', 'checking', 'credit', 'wallet', 'cash', 'investment', 'loan'];

const accountCreate = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').optional().isIn(ACCOUNT_TYPES).withMessage('Valid account type is required'),
  body('balance').optional({ checkFalsy: true }).isNumeric().withMessage('Balance must be numeric'),
  validate,
];

const accountUpdate = [
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(ACCOUNT_TYPES),
  body('balance').optional().isNumeric(),
  validate,
];

router.get('/', c.getAll);
router.post('/', accountCreate, c.create);
router.put('/:id', accountUpdate, c.update);
router.delete('/:id', c.remove);
module.exports = router;
