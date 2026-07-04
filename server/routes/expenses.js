const express = require('express');
const { body } = require('express-validator');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const expenseValidation = [
  body('category_id').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long'),
];

router.use(protect);

router.get('/summary', getExpenseSummary);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', expenseValidation, createExpense);
router.put('/:id', expenseValidation, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
