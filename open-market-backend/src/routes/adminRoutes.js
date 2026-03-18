import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getUsers,
  manageUser,
  getProducts,
  manageProduct,
  getOrders,
  manageOrder,
  getCategories,
  manageCategory,
  getReports,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id', manageUser);

// Product management
router.get('/products', getProducts);
router.put('/products/:id', manageProduct);

// Order management
router.get('/orders', getOrders);
router.put('/orders/:id', manageOrder);

// Category management
router.get('/categories', getCategories);
router.put('/categories/:id', manageCategory);

// Reports
router.get('/reports', getReports);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
