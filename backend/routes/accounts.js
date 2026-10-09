const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/accountController');
const { validate } = require('../middleware/validator');

const accountValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(['savings', 'checking', 'credit', 'cash', 'investment', 'loan']).withMessage('Valid account type is required'),
  body('balance').isNumeric().withMessage('Balance must be numeric'),
  validate
];

router.get('/',        c.getAll);
router.post('/',       accountValidation, c.create);
router.put('/:id',     accountValidation, c.update);
router.delete('/:id',  c.remove);
module.exports = router;
