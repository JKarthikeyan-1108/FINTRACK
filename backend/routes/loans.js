const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/loanController');
const { validate } = require('../middleware/validator');

const loanValidation = [
  body('principal').isFloat({ gt: 0 }).withMessage('Principal must be > 0'),
  body('interest_rate').isFloat({ min: 0 }).withMessage('Interest rate must be >= 0'),
  body('remaining').isFloat({ min: 0 }).withMessage('Remaining must be >= 0'),
  body('tenure_months').isInt({ gt: 0 }).withMessage('Tenure months must be > 0'),
  validate
];

router.get('/',        c.getAll);
router.post('/',       loanValidation, c.create);
router.put('/:id',     loanValidation, c.update);
router.delete('/:id',  c.remove);
module.exports = router;
