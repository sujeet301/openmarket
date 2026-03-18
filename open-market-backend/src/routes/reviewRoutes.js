import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
  moderateReview
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getReviews);
router.get('/:id', getReview);

// Protected routes
router.use(protect);

// User routes
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);
router.post('/:id/report', reportReview);

// Admin routes
router.put('/:id/moderate', authorize('admin'), moderateReview);

export default router;
