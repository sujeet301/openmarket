import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

// @desc    Get seller dashboard
// @route   GET /api/seller/dashboard
// @access  Private/Seller
export const getDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));
    const startOfYear = new Date(today.setFullYear(today.getFullYear() - 1));

    // Get seller info
    const seller = await User.findById(sellerId).select('sellerDetails');

    // Get product stats
    const productStats = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$lowStockThreshold'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalViews: { $sum: '$views' },
          totalSold: { $sum: '$soldQuantity' }
        }
      }
    ]);

    // Get order stats
    const orderStats = await Order.aggregate([
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$items.total' },
          totalCommission: { $sum: '$items.commission.amount' },
          netEarnings: { $sum: '$items.sellerEarnings' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get today's stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          'items.seller': mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: startOfDay }
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$items.total' },
          items: { $sum: '$items.quantity' }
        }
      }
    ]);

    // Get weekly stats
    const weeklyStats = await Order.aggregate([
      {
        $match: {
          'items.seller': mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: startOfWeek }
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$items.total' },
          items: { $sum: '$items.quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get monthly stats
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          'items.seller': mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: startOfYear }
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$items.total' },
          items: { $sum: '$items.quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ 'items.seller': sellerId })
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    // Format recent orders to show only seller's items
    const formattedRecentOrders = recentOrders.map(order => {
      const orderObj = order.toObject();
      orderObj.sellerItems = orderObj.items.filter(
        item => item.seller.toString() === sellerId
      );
      return orderObj;
    });

    // Get top selling products
    const topProducts = await Product.find({ 
      seller: sellerId,
      isActive: true 
    })
      .sort('-soldQuantity')
      .limit(5)
      .select('name images price soldQuantity quantity');

    // Get pending reviews for seller's products
    const pendingReviews = await Review.find({
      product: { $in: await Product.find({ seller: sellerId }).distinct('_id') },
      status: 'pending'
    }).countDocuments();

    // Get unread notifications count
    const unreadNotifications = seller?.notifications?.filter(n => !n.read)?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        seller: {
          storeName: seller?.sellerDetails?.storeName,
          storeLogo: seller?.sellerDetails?.storeLogo,
          verificationStatus: seller?.sellerDetails?.verificationStatus,
          rating: seller?.sellerDetails?.rating,
          totalReviews: seller?.sellerDetails?.totalReviews,
          commission: seller?.sellerDetails?.commission || 10
        },
        products: productStats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          outOfStock: 0,
          lowStock: 0,
          totalViews: 0,
          totalSold: 0
        },
        orders: orderStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalCommission: 0,
          netEarnings: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0
        },
        today: todayStats[0] || { orders: 0, revenue: 0, items: 0 },
        weekly: weeklyStats,
        monthly: monthlyStats,
        recentOrders: formattedRecentOrders,
        topProducts,
        pendingReviews,
        notifications: {
          unread: unreadNotifications,
          total: seller?.notifications?.length || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics
// @route   GET /api/seller/analytics
// @access  Private/Seller
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        'items.seller': mongoose.Types.ObjectId(sellerId),
        createdAt: {}
      };
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSales: { $sum: '$items.total' },
          quantity: { $sum: '$items.quantity' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryName: '$category.name',
          categorySlug: '$category.slug',
          totalSales: 1,
          quantity: 1,
          orders: 1
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Daily/Monthly sales trend
    let groupBy;
    if (period === 'day') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      };
    } else if (period === 'week') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' },
        date: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
      };
    } else {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        date: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      };
    }

    const salesTrend = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: '$items.total' },
          orders: { $sum: 1 },
          items: { $sum: '$items.quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$items.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Average order value over time
    const averageOrderValue = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: '$items.order',
          orderTotal: { $sum: '$items.total' }
        }
      },
      {
        $group: {
          _id: null,
          averageValue: { $avg: '$orderTotal' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        salesByCategory,
        salesTrend,
        paymentMethods,
        averageOrderValue: averageOrderValue[0]?.averageValue || 0,
        summary: {
          totalSales: salesByCategory.reduce((sum, cat) => sum + cat.totalSales, 0),
          totalOrders: salesByCategory.reduce((sum, cat) => sum + cat.orders, 0),
          totalItems: salesByCategory.reduce((sum, cat) => sum + cat.quantity, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory
// @route   GET /api/seller/inventory
// @access  Private/Seller
export const getInventory = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Product.find({ seller: req.user.id }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query
      .populate('category', 'name')
      .select('name sku price quantity soldQuantity reservedQuantity lowStockThreshold images isActive');

    const total = await features.count();

    // Get inventory summary
    const summary = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          totalSold: { $sum: '$soldQuantity' },
          lowStockCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$lowStockThreshold'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      summary: summary[0] || {
        totalProducts: 0,
        totalQuantity: 0,
        totalReserved: 0,
        totalSold: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory
// @route   PUT /api/seller/inventory/:productId
// @access  Private/Seller
export const updateInventory = async (req, res, next) => {
  try {
    const { quantity, operation, reason } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id) {
      throw new AppError('You do not have permission to update this product', 403);
    }

    // Update quantity based on operation
    if (operation === 'add') {
      product.quantity += quantity;
    } else if (operation === 'subtract') {
      if (product.quantity < quantity) {
        throw new AppError('Insufficient quantity', 400);
      }
      product.quantity -= quantity;
    } else if (operation === 'set') {
      product.quantity = quantity;
    } else {
      throw new AppError('Invalid operation', 400);
    }

    // Update low stock threshold if provided
    if (req.body.lowStockThreshold) {
      product.lowStockThreshold = req.body.lowStockThreshold;
    }

    await product.save();

    // Create inventory log (you might want to create an InventoryLog model)
    const inventoryLog = {
      product: product._id,
      previousQuantity: product.quantity - (operation === 'add' ? quantity : 
                        operation === 'subtract' ? -quantity : 0),
      newQuantity: product.quantity,
      operation,
      quantity,
      reason,
      updatedBy: req.user.id
    };

    // Emit socket event for low stock alert
    if (product.quantity <= product.lowStockThreshold && req.io) {
      req.io.to(`seller:${req.user.id}`).emit('low_stock_alert', {
        productId: product._id,
        productName: product.name,
        currentStock: product.quantity,
        threshold: product.lowStockThreshold
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller profile
// @route   GET /api/seller/profile
// @access  Private/Seller
export const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.user.id)
      .select('name email phoneNumber profilePicture sellerDetails addresses');

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update seller profile
// @route   PUT /api/seller/profile
// @access  Private/Seller
export const updateSellerProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'phoneNumber',
      'profilePicture',
      'sellerDetails.storeName',
      'sellerDetails.storeDescription',
      'sellerDetails.storeLogo',
      'sellerDetails.storeBanner',
      'addresses'
    ];

    const updateData = {};
    
    // Handle nested fields
    if (req.body.sellerDetails) {
      updateData['sellerDetails.storeName'] = req.body.sellerDetails.storeName;
      updateData['sellerDetails.storeDescription'] = req.body.sellerDetails.storeDescription;
      updateData['sellerDetails.storeLogo'] = req.body.sellerDetails.storeLogo;
      updateData['sellerDetails.storeBanner'] = req.body.sellerDetails.storeBanner;
    }

    // Handle top-level fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phoneNumber) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.profilePicture) updateData.profilePicture = req.body.profilePicture;
    if (req.body.addresses) updateData.addresses = req.body.addresses;

    const seller = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('name email phoneNumber profilePicture sellerDetails addresses');

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payouts
// @route   GET /api/seller/payouts
// @access  Private/Seller
export const getPayouts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Get all orders with seller's items
    const orders = await Order.aggregate([
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$items.total' },
          totalCommission: { $sum: '$items.commission.amount' },
          netEarnings: { $sum: '$items.sellerEarnings' },
          orders: { $sum: 1 },
          items: { $sum: '$items.quantity' },
          startDate: { $min: '$createdAt' },
          endDate: { $max: '$createdAt' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    // Get pending payouts
    const pendingPayouts = await Order.aggregate([
      {
        $match: {
          'items.seller': mongoose.Types.ObjectId(sellerId),
          'sellerPayouts.status': 'pending',
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$items.sellerEarnings' },
          totalCommission: { $sum: '$items.commission.amount' },
          totalSales: { $sum: '$items.total' },
          orders: { $sum: 1 }
        }
      }
    ]);

    // Get payout history (you would have a Payout model for this)
    // For now, return aggregated data

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEarnings: orders.reduce((sum, month) => sum + month.netEarnings, 0),
          totalCommission: orders.reduce((sum, month) => sum + month.totalCommission, 0),
          totalSales: orders.reduce((sum, month) => sum + month.totalSales, 0),
          pendingAmount: pendingPayouts[0]?.totalAmount || 0,
          availableForPayout: pendingPayouts[0]?.totalAmount || 0
        },
        monthlyPayouts: orders,
        pending: pendingPayouts[0] || {
          totalAmount: 0,
          totalCommission: 0,
          totalSales: 0,
          orders: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request payout
// @route   POST /api/seller/payouts/request
// @access  Private/Seller
export const requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const sellerId = req.user.id;

    // Get seller's bank details
    const seller = await User.findById(sellerId).select('sellerDetails.bankDetails');

    if (!seller.sellerDetails?.bankDetails?.accountNumber) {
      throw new AppError('Please add bank details before requesting payout', 400);
    }

    // Check available balance
    const pendingPayouts = await Order.aggregate([
      {
        $match: {
          'items.seller': mongoose.Types.ObjectId(sellerId),
          'sellerPayouts.status': 'pending',
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          availableAmount: { $sum: '$items.sellerEarnings' }
        }
      }
    ]);

    const availableAmount = pendingPayouts[0]?.availableAmount || 0;

    if (amount > availableAmount) {
      throw new AppError(`Insufficient balance. Available: ${availableAmount}`, 400);
    }

    if (amount < seller.sellerDetails?.payoutSettings?.minimumPayout || 100) {
      throw new AppError(`Minimum payout amount is ${seller.sellerDetails?.payoutSettings?.minimumPayout || 100}`, 400);
    }

    // Create payout request (you would create a Payout model)
    // For now, update seller payouts status in orders
    const orders = await Order.find({
      'items.seller': sellerId,
      'sellerPayouts.status': 'pending',
      paymentStatus: 'completed'
    });

    let remainingAmount = amount;
    const payoutOrders = [];

    for (const order of orders) {
      if (remainingAmount <= 0) break;

      const sellerPayout = order.sellerPayouts.find(
        p => p.seller.toString() === sellerId && p.status === 'pending'
      );

      if (sellerPayout) {
        const payoutAmount = Math.min(sellerPayout.netAmount, remainingAmount);
        sellerPayout.status = 'processing';
        // In real implementation, you would create a payout record
        payoutOrders.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: payoutAmount
        });
        remainingAmount -= payoutAmount;
      }
    }

    // Send notification to admin
    if (req.io) {
      req.io.to('admin').emit('payout_requested', {
        sellerId,
        sellerName: req.user.name,
        amount,
        orders: payoutOrders.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        requestedAmount: amount,
        processedOrders: payoutOrders,
        remainingBalance: remainingAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller settings
// @route   GET /api/seller/settings
// @access  Private/Seller
export const getSellerSettings = async (req, res, next) => {
  try {
    const seller = await User.findById(req.user.id)
      .select('sellerSettings notificationSettings');

    res.status(200).json({
      success: true,
      data: {
        store: seller?.sellerDetails || {},
        notifications: seller?.notificationSettings || {},
        shipping: seller?.shippingSettings || {},
        returnPolicy: seller?.returnPolicy || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update seller settings
// @route   PUT /api/seller/settings
// @access  Private/Seller
export const updateSellerSettings = async (req, res, next) => {
  try {
    const { store, notifications, shipping, returnPolicy } = req.body;

    const updateData = {};

    if (store) {
      updateData['sellerDetails.storeName'] = store.storeName;
      updateData['sellerDetails.storeDescription'] = store.storeDescription;
      updateData['sellerDetails.storeLogo'] = store.storeLogo;
      updateData['sellerDetails.storeBanner'] = store.storeBanner;
    }

    if (notifications) {
      updateData['notificationSettings'] = notifications;
    }

    if (shipping) {
      updateData['shippingSettings'] = shipping;
    }

    if (returnPolicy) {
      updateData['returnPolicy'] = returnPolicy;
    }

    const seller = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('sellerDetails notificationSettings shippingSettings returnPolicy');

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller performance metrics
// @route   GET /api/seller/performance
// @access  Private/Seller
export const getPerformanceMetrics = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const metrics = await Order.aggregate([
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalItems: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          averageOrderValue: { $avg: '$items.total' },
          onTimeDelivery: {
            $avg: {
              $cond: [
                { 
                  $and: [
                    { $lte: ['$items.deliveredAt', '$items.estimatedDelivery'] },
                    { $ne: ['$items.deliveredAt', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          cancellationRate: {
            $avg: {
              $cond: [{ $eq: ['$items.status', 'cancelled'] }, 1, 0]
            }
          },
          returnRate: {
            $avg: {
              $cond: [{ $eq: ['$items.status', 'returned'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get average response time to reviews
    const responseTime = await Review.aggregate([
      {
        $match: {
          product: { $in: await Product.find({ seller: sellerId }).distinct('_id') },
          'sellerResponse.respondedAt': { $ne: null }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$sellerResponse.respondedAt', '$createdAt'] },
              3600000 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...metrics[0] || {
          totalOrders: 0,
          totalItems: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          onTimeDelivery: 0,
          cancellationRate: 0,
          returnRate: 0
        },
        averageResponseTime: responseTime[0]?.averageResponseTime || 0,
        rating: req.user.sellerDetails?.rating || 0,
        totalReviews: req.user.sellerDetails?.totalReviews || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories for seller
// @route   GET /api/seller/categories
// @access  Private/Seller
export const getSellerCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug parent')
      .populate('children', 'name slug');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update product prices
// @route   POST /api/seller/products/bulk-price-update
// @access  Private/Seller
export const bulkUpdatePrices = async (req, res, next) => {
  try {
    const { updates } = req.body; // [{ productId, price, compareAtPrice, discount }]

    const operations = updates.map(update => ({
      updateOne: {
        filter: { 
          _id: update.productId,
          seller: req.user.id 
        },
        update: {
          $set: {
            price: update.price,
            compareAtPrice: update.compareAtPrice,
            discount: update.discount,
            isOnSale: !!(update.discount || update.compareAtPrice > update.price)
          }
        }
      }
    }));

    const result = await Product.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} products successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export seller products
// @route   GET /api/seller/products/export
// @access  Private/Seller
export const exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate('category', 'name')
      .lean();

    const exportData = products.map(p => ({
      name: p.name,
      sku: p.sku,
      price: p.price,
      quantity: p.quantity,
      category: p.category?.name,
      status: p.isActive ? 'Active' : 'Inactive',
      soldQuantity: p.soldQuantity,
      views: p.views,
      rating: p.rating
    }));

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};