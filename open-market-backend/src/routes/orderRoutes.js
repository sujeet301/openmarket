import express from 'express';
import { protect, authorize, restrictToSeller } from '../middleware/auth.js';
import {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getSellerOrders,
  getOrderAnalytics
} from '../controllers/orderController.js';

const router = express.Router();

// Protected routes
router.use(protect);

// User routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Seller routes
router.get('/seller/orders', restrictToSeller, getSellerOrders);
router.put('/:id/status', restrictToSeller, updateOrderStatus);

// Admin routes
router.get('/admin/analytics', authorize('admin'), getOrderAnalytics);
router.put('/admin/:id/status', authorize('admin'), updateOrderStatus);

export default router;
