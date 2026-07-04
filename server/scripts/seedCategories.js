require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const connectDB = require('../config/db');

const defaultCategories = [
  { name: 'Groceries', icon: '🛒', color: '#22c55e', user_id: null },
  { name: 'Rent', icon: '🏠', color: '#6366f1', user_id: null },
  { name: 'Utilities', icon: '💡', color: '#f59e0b', user_id: null },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', user_id: null },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', user_id: null },
  { name: 'Dining Out', icon: '🍽️', color: '#ef4444', user_id: null },
  { name: 'Healthcare', icon: '💊', color: '#14b8a6', user_id: null },
  { name: 'Shopping', icon: '🛍️', color: '#a855f7', user_id: null },
  { name: 'Education', icon: '📚', color: '#0ea5e9', user_id: null },
  { name: 'Savings', icon: '💰', color: '#84cc16', user_id: null },
  { name: 'Travel', icon: '✈️', color: '#f97316', user_id: null },
  { name: 'Other', icon: '📦', color: '#94a3b8', user_id: null },
];

const seed = async () => {
  await connectDB();

  console.log('Seeding default categories...');
  await Category.deleteMany({ user_id: null });
  await Category.insertMany(defaultCategories);
  console.log(`Inserted ${defaultCategories.length} default categories.`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
