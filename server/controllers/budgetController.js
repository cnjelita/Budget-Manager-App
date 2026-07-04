const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const MONTH_YEAR_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const toObjectId = (str) => {
  if (typeof str !== 'string' || !mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

// @desc    Get budgets for the current month (or specified month)
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rawMonthYear = typeof req.query.month_year === 'string' ? req.query.month_year : '';
    const month_year = MONTH_YEAR_RE.test(rawMonthYear) ? rawMonthYear : defaultMonth;

    const budgets = await Budget.find({
      user_id: req.user._id,
      month_year,
    }).populate('category_id', 'name icon color');

    // Calculate spending for each budget category
    const [year, month] = month_year.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const spendingMap = {};
    const spending = await Expense.aggregate([
      {
        $match: {
          user_id: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category_id',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    spending.forEach((s) => {
      spendingMap[s._id.toString()] = s.spent;
    });

    const budgetsWithProgress = budgets.map((b) => {
      const spent = spendingMap[b.category_id._id.toString()] || 0;
      return {
        ...b.toObject(),
        spent,
        remaining: Math.max(b.amount_limit - spent, 0),
        progress_percent: Math.min((spent / b.amount_limit) * 100, 100).toFixed(1),
      };
    });

    res.json({ success: true, month_year, data: budgetsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set or update a budget for a category
// @route   POST /api/budgets
// @access  Private
const upsertBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { category_id, amount_limit } = req.body;
    const rawMonthYear = typeof req.body.month_year === 'string' ? req.body.month_year : '';
    const month_year = MONTH_YEAR_RE.test(rawMonthYear) ? rawMonthYear : defaultMonth;

    const catId = toObjectId(category_id);
    if (!catId) return res.status(400).json({ success: false, message: 'Invalid category ID' });

    const limit = parseFloat(amount_limit);
    if (!isFinite(limit) || limit < 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount_limit' });
    }

    const budget = await Budget.findOneAndUpdate(
      { user_id: req.user._id, category_id: catId, month_year },
      { amount_limit: limit },
      { new: true, upsert: true, runValidators: true }
    ).populate('category_id', 'name icon color');

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budgetId = toObjectId(req.params.id);
    if (!budgetId) return res.status(400).json({ success: false, message: 'Invalid budget ID' });

    const budget = await Budget.findOne({
      _id: budgetId,
      user_id: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await budget.deleteOne();

    res.json({ success: true, message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
