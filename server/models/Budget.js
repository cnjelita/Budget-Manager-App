const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
    },
    amount_limit: {
      type: Number,
      required: [true, 'Budget amount limit is required'],
      min: [0, 'Budget amount cannot be negative'],
    },
    month_year: {
      type: String,
      required: [true, 'Month/year is required'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'month_year must be in YYYY-MM format'],
    },
  },
  { timestamps: true }
);

// Prevent duplicate budgets for the same user/category/month
BudgetSchema.index({ user_id: 1, category_id: 1, month_year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
