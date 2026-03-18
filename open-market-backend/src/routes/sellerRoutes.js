import express from 'express';
import { protect, restrictToSeller } from '../middleware/auth.js';
import {
  getDashboard,
  getSalesAnalytics,
  getInventory,
  updateInventory,
  getSellerProfile,
  updateSellerProfile,
  getPayouts,
  requestPayout
} from '../controllers/sellerController.js';

const router = express.Router();

// All routes require seller role
router.use(protect);
router.use(restrictToSeller);

router.get('/dashboard', getDashboard);
router.get('/analytics', getSalesAnalytics);
router.get('/inventory', getInventory);
router.put('/inventory/:productId', updateInventory);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.get('/payouts', getPayouts);
router.post('/payouts/request', requestPayout);

export default router;
