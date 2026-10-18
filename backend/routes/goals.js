const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/goalController');
const { validate } = require('../middleware/validator');

router.get('/', ctrl.getAll);
router.post('/', [
  body('name').trim().notEmpty(),
  body('target_amount').isFloat({ gt: 0 }),
  validate,
], ctrl.create);
router.post('/:id/contribute', [
  body('amount').isFloat({ gt: 0 }),
  body('type').optional().isIn(['deposit', 'withdraw']),
  validate,
], ctrl.contribute);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
