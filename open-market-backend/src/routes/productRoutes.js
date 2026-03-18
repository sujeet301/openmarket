import express from 'express';
import { body } from 'express-validator';
import { protect, authorize, restrictToSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  addProductReview,
  getProductReviews,
  searchProducts,
  getFeaturedProducts,
  getRelatedProducts
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProduct);
router.get('/:id/reviews', getProductReviews);

// Protected routes
router.use(protect);

// Review routes
router.post('/:id/reviews', addProductReview);

// Seller routes
router.get('/seller/me', restrictToSeller, getSellerProducts);
router.post('/', 
  restrictToSeller,
  validate([
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number')
  ]),
  createProduct
);
router.put('/:id', restrictToSeller, updateProduct);
router.delete('/:id', restrictToSeller, deleteProduct);

export default router;