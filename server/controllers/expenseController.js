const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// Helper: validate and cast a string to ObjectId (returns null if invalid)
const toObjectId = (str) => {
  if (typeof str !== 'string' || !mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

// Helper: safely parse a date string (returns null if invalid)
const toDate = (str) => {
  if (typeof str !== 'string') return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// Helper: safely parse a positive float (returns null if invalid)
const toPositiveFloat = (str) => {
  const n = parseFloat(str);
  return isFinite(n) && n >= 0 ? n : null;
};

// @desc    Get all expenses for the current user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, page = 1, limit = 20 } = req.query;

    const filter = { user_id: req.user._id };

    if (category) {
      const catId = toObjectId(category);
      if (!catId) return res.status(400).json({ success: false, message: 'Invalid category ID' });
      filter.category_id = catId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const d = toDate(startDate);
        if (!d) return res.status(400).json({ success: false, message: 'Invalid startDate' });
        filter.date.$gte = d;
      }
      if (endDate) {
        const d = toDate(endDate);
        if (!d) return res.status(400).json({ success: false, message: 'Invalid endDate' });
        d.setHours(23, 59, 59, 999);
        filter.date.$lte = d;
      }
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        const n = toPositiveFloat(minAmount);
        if (n === null) return res.status(400).json({ success: false, message: 'Invalid minAmount' });
        filter.amount.$gte = n;
      }
      if (maxAmount) {
        const n = toPositiveFloat(maxAmount);
        if (n === null) return res.status(400).json({ success: false, message: 'Invalid maxAmount' });
        filter.amount.$lte = n;
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    const total = await Expense.countDocuments(filter);

    const expenses = await Expense.find(filter)
      .populate('category_id', 'name icon color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: expenses.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expenseId = toObjectId(req.params.id);
    if (!expenseId) return res.status(400).json({ success: false, message: 'Invalid expense ID' });

    const expense = await Expense.findOne({
      _id: expenseId,
      user_id: req.user._id,
    }).populate('category_id', 'name icon color');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { category_id, amount, date, description } = req.body;

    const catId = toObjectId(category_id);
    if (!catId) return res.status(400).json({ success: false, message: 'Invalid category ID' });

    const expense = await Expense.create({
      user_id: req.user._id,
      category_id: catId,
      amount: parseFloat(amount),
      date: date ? new Date(date) : Date.now(),
      description: typeof description === 'string' ? description : '',
    });

    const populated = await expense.populate('category_id', 'name icon color');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const expenseId = toObjectId(req.params.id);
    if (!expenseId) return res.status(400).json({ success: false, message: 'Invalid expense ID' });

    let expense = await Expense.findOne({
      _id: expenseId,
      user_id: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { category_id, amount, date, description } = req.body;
    const catId = toObjectId(category_id);
    if (!catId) return res.status(400).json({ success: false, message: 'Invalid category ID' });

    expense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        category_id: catId,
        amount: parseFloat(amount),
        date: date ? new Date(date) : expense.date,
        description: typeof description === 'string' ? description : expense.description,
      },
      { new: true, runValidators: true }
    ).populate('category_id', 'name icon color');

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expenseId = toObjectId(req.params.id);
    if (!expenseId) return res.status(400).json({ success: false, message: 'Invalid expense ID' });

    const expense = await Expense.findOne({
      _id: expenseId,
      user_id: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await expense.deleteOne();

    res.json({ success: true, message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expense summary for dashboard
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const summary = await Expense.aggregate([
      {
        $match: {
          user_id: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category_id',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          category_id: '$_id',
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color',
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalSpent = summary.reduce((sum, item) => sum + item.total, 0);

    res.json({
      success: true,
      month_year: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      total_spent: totalSpent,
      by_category: summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseSummary };
