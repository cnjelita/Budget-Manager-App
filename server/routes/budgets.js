const express = require('express');
const { body } = require('express-validator');
const { getBudgets, upsertBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getBudgets);
router.post(
  '/',
  [
    body('category_id').notEmpty().withMessage('Category is required'),
    body('amount_limit').isFloat({ min: 0 }).withMessage('Amount limit must be a non-negative number'),
    body('month_year')
      .optional()
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage('month_year must be in YYYY-MM format'),
  ],
  upsertBudget
);
router.delete('/:id', deleteBudget);

module.exports = router;
