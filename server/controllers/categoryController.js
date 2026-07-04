const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Category = require('../models/Category');

const toObjectId = (str) => {
  if (typeof str !== 'string' || !mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

// @desc    Get all categories (global + user-specific)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ user_id: null }, { user_id: req.user._id }],
    }).sort({ name: 1 });

    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const name = String(req.body.name || '').trim();
    const icon = typeof req.body.icon === 'string' ? req.body.icon.trim() : '📦';
    const color = typeof req.body.color === 'string' ? req.body.color.trim() : '#6366f1';

    const category = await Category.create({
      user_id: req.user._id,
      name,
      icon: icon || '📦',
      color: color || '#6366f1',
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user-created category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const categoryId = toObjectId(req.params.id);
    if (!categoryId) return res.status(400).json({ success: false, message: 'Invalid category ID' });

    const category = await Category.findOne({
      _id: categoryId,
      user_id: req.user._id,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or not deletable' });
    }

    await category.deleteOne();

    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
