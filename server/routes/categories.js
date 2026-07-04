const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getCategories);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('icon').optional().trim(),
    body('color').optional().matches(/^#([0-9A-Fa-f]{6})$/).withMessage('Invalid hex color'),
  ],
  createCategory
);
router.delete('/:id', deleteCategory);

module.exports = router;
