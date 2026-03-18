import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));
    const startOfYear = new Date(today.setFullYear(today.getFullYear() - 1));

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeToday: {
            $sum: {
              $cond: [
                { $gte: ['$lastActive', startOfDay] },
                1,
                0
              ]
            }
          },
          newToday: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfDay] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Product statistics
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
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
          pendingApproval: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    // Order statistics
    const orderStats = await Order.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                averageOrderValue: { $avg: '$totalAmount' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
              }
            }
          ],
          today: [
            {
              $match: {
                createdAt: { $gte: startOfDay }
              }
            },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
              }
            }
          ],
          thisWeek: [
            {
              $match: {
                createdAt: { $gte: startOfWeek }
              }
            },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
              }
            }
          ],
          thisMonth: [
            {
              $match: {
                createdAt: { $gte: startOfMonth }
              }
            },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
              }
            }
          ]
        }
      }
    ]);

    // Revenue chart data (last 30 days)
    const revenueChart = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          date: { $first: '$createdAt' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Pending reviews
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    // Pending seller verifications
    const pendingSellers = await User.countDocuments({
      role: 'seller',
      'sellerDetails.verificationStatus': 'pending'
    });

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort('-soldQuantity')
      .limit(5)
      .populate('seller', 'name sellerDetails.storeName')
      .select('name images price soldQuantity');

    // Recent orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: userStats.reduce((sum, stat) => sum + stat.count, 0),
          clients: userStats.find(s => s._id === 'client')?.count || 0,
          sellers: userStats.find(s => s._id === 'seller')?.count || 0,
          admins: userStats.find(s => s._id === 'admin')?.count || 0,
          activeToday: userStats.reduce((sum, stat) => sum + (stat.activeToday || 0), 0),
          newToday: userStats.reduce((sum, stat) => sum + (stat.newToday || 0), 0)
        },
        products: productStats[0] || {
          total: 0,
          active: 0,
          outOfStock: 0,
          lowStock: 0,
          pendingApproval: 0
        },
        orders: {
          overview: orderStats[0]?.overview[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalItems: 0
          },
          byStatus: orderStats[0]?.byStatus || [],
          today: orderStats[0]?.today[0] || { orders: 0, revenue: 0 },
          thisWeek: orderStats[0]?.thisWeek[0] || { orders: 0, revenue: 0 },
          thisMonth: orderStats[0]?.thisMonth[0] || { orders: 0, revenue: 0 }
        },
        revenueChart,
        pendingReviews,
        pendingSellers,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query.select('-password -refreshToken -twoFactorSecret');
    const total = await features.count();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage user (update/block/verify)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const manageUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cannot modify admin users unless super admin (you might want to add this check)
    if (user.role === 'admin' && req.user.id !== req.params.id) {
      throw new AppError('Cannot modify other admin users', 403);
    }

    const allowedUpdates = [
      'name',
      'email',
      'role',
      'isActive',
      'isBlocked',
      'blockedReason',
      'emailVerified',
      'phoneVerified',
      'sellerDetails.verificationStatus',
      'sellerDetails.commission'
    ];

    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) || key.startsWith('sellerDetails.')) {
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (!updateData[parent]) updateData[parent] = {};
          updateData[parent][child] = req.body[key];
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    // Special handling for blocking
    if (req.body.isBlocked !== undefined) {
      updateData.isBlocked = req.body.isBlocked;
      updateData.blockedAt = req.body.isBlocked ? new Date() : null;
      updateData.blockedBy = req.body.isBlocked ? req.user.id : null;
    }

    // Special handling for seller verification
    if (req.body.sellerDetails?.verificationStatus) {
      updateData['sellerDetails.verificationStatus'] = req.body.sellerDetails.verificationStatus;
      if (req.body.sellerDetails.verificationStatus === 'verified') {
        updateData['sellerDetails.verifiedAt'] = new Date();
        updateData['sellerDetails.verifiedBy'] = req.user.id;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken -twoFactorSecret');

    // Emit socket event
    if (req.io) {
      req.io.to(`user:${user._id}`).emit('account_updated', {
        action: req.body.isBlocked ? 'blocked' : 'updated',
        by: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
export const getProducts = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Product.find().populate('seller', 'name email sellerDetails.storeName'),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query;
    const total = await features.count();

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage product (approve/reject/feature)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const manageProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const allowedUpdates = [
      'status',
      'isActive',
      'isFeatured',
      'isBestSeller',
      'adminNotes',
      'rejectionReason',
      'commission'
    ];

    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Add review info
    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      updateData.reviewedBy = req.user.id;
      updateData.reviewedAt = new Date();
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    // Notify seller
    if (req.io) {
      req.io.to(`user:${product.seller}`).emit('product_updated', {
        productId: product._id,
        productName: product.name,
        status: req.body.status || 'updated'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Order.find()
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .populate('items.seller', 'name sellerDetails.storeName'),
      req.query
    )
      .filter()
      .sort('-createdAt')
      .limitFields()
      .paginate();

    const orders = await features.query;
    const total = await features.count();

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage order
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
export const manageOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const allowedUpdates = [
      'status',
      'paymentStatus',
      'trackingNumber',
      'adminNotes',
      'internalNotes'
    ];

    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Add to status history
    if (req.body.status) {
      updateData.$push = {
        statusHistory: {
          status: req.body.status,
          date: new Date(),
          comment: req.body.comment || 'Order updated by admin',
          updatedBy: req.user.id
        }
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Notify user
    if (req.io) {
      req.io.to(`user:${order.user}`).emit('order_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: req.body.status || order.status
      });
    }

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
export const getCategories = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Category.find().populate('parent', 'name'),
      req.query
    )
      .filter()
      .sort('displayOrder name')
      .limitFields()
      .paginate();

    const categories = await features.query;
    const total = await features.count();

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
export const manageCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const allowedUpdates = [
      'name',
      'description',
      'isActive',
      'isFeatured',
      'displayOrder',
      'showInMenu',
      'showInHome',
      'image',
      'icon',
      'seo',
      'attributes',
      'filters',
      'commission'
    ];

    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedBy = req.user.id;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let reportData = {};

    switch (type) {
      case 'sales':
        reportData = await Order.aggregate([
          { $match: { ...dateFilter, paymentStatus: 'completed' } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              sales: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
              items: { $sum: { $sum: '$items.quantity' } },
              date: { $first: '$createdAt' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;

      case 'products':
        reportData = await Product.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$category',
              totalProducts: { $sum: 1 },
              activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
              totalViews: { $sum: '$views' },
              totalSold: { $sum: '$soldQuantity' },
              totalRevenue: { $sum: { $multiply: ['$price', '$soldQuantity'] } }
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
          { $unwind: '$category' }
        ]);
        break;

      case 'users':
        reportData = await User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 },
              verified: { $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] } },
              active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
            }
          }
        ]);
        break;

      case 'sellers':
        reportData = await User.aggregate([
          { $match: { role: 'seller', ...dateFilter } },
          {
            $group: {
              _id: '$sellerDetails.verificationStatus',
              count: { $sum: 1 },
              totalProducts: { $sum: '$sellerDetails.totalProducts' },
              totalSales: { $sum: '$sellerDetails.totalSales' }
            }
          }
        ]);
        break;

      default:
        // Combined report
        reportData = {
          sales: await Order.aggregate([
            { $match: { ...dateFilter, paymentStatus: 'completed' } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$totalAmount' }
              }
            }
          ]),
          users: await User.countDocuments(dateFilter),
          products: await Product.countDocuments(dateFilter),
          pendingReviews: await Review.countDocuments({ status: 'pending' })
        };
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req, res, next) => {
  try {
    // You would have a Settings model for this
    // For now, return default settings
    const settings = {
      site: {
        name: 'Open Market',
        description: 'Multi-vendor e-commerce platform',
        logo: '/logo.png',
        favicon: '/favicon.ico',
        email: 'support@openmarket.com',
        phone: '+1 234 567 8900',
        address: '123 Market Street, City, Country'
      },
      currency: {
        code: 'INR',
        symbol: '₹',
        position: 'left'
      },
      tax: {
        enabled: true,
        rate: 18,
        type: 'gst'
      },
      shipping: {
        methods: ['standard', 'express', 'free'],
        defaultMethod: 'standard',
        freeShippingThreshold: 500
      },
      payment: {
        methods: ['cod', 'card', 'upi', 'netbanking'],
        codEnabled: true,
        stripeEnabled: true,
        razorpayEnabled: true
      },
      commission: {
        defaultRate: 10,
        categories: []
      },
      email: {
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true
        },
        templates: {}
      },
      seo: {
        title: 'Open Market - Buy and Sell Anything',
        description: 'Open Market is a multi-vendor e-commerce platform',
        keywords: ['ecommerce', 'marketplace', 'shopping']
      },
      features: {
        reviews: true,
        wishlist: true,
        compare: true,
        giftCards: false,
        coupons: true
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
  try {
    // You would update a Settings model here
    // For now, just return the updated settings
    const settings = req.body;

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getSystemLogs = async (req, res, next) => {
  try {
    const { level, limit = 100 } = req.query;

    // You would have a Log model for this
    // For now, return mock data
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System started',
        module: 'server'
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        level: 'error',
        message: 'Database connection failed',
        module: 'database'
      }
    ];

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller verification requests
// @route   GET /api/admin/seller-verifications
// @access  Private/Admin
export const getSellerVerifications = async (req, res, next) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      'sellerDetails.verificationStatus': 'pending'
    })
      .select('name email sellerDetails createdAt')
      .populate('sellerDetails.documents');

    res.status(200).json({
      success: true,
      count: sellers.length,
      data: sellers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify seller documents
// @route   POST /api/admin/verify-seller/:id
// @access  Private/Admin
export const verifySeller = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== 'seller') {
      throw new AppError('Seller not found', 404);
    }

    seller.sellerDetails.verificationStatus = status;
    seller.sellerDetails.verificationSubmittedAt = new Date();
    seller.sellerDetails.verifiedBy = req.user.id;

    if (status === 'verified') {
      seller.sellerDetails.verifiedAt = new Date();
    } else if (status === 'rejected') {
      seller.sellerDetails.rejectionReason = remarks;
    }

    await seller.save();

    // Notify seller
    if (req.io) {
      req.io.to(`user:${seller._id}`).emit('verification_updated', {
        status,
        remarks
      });
    }

    res.status(200).json({
      success: true,
      message: `Seller ${status} successfully`,
      data: {
        id: seller._id,
        name: seller.name,
        verificationStatus: seller.sellerDetails.verificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const analytics = {
      revenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      userGrowth: await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      topCategories: await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $project: {
            name: 1,
            productCount: { $size: '$products' },
            revenue: {
              $sum: {
                $map: {
                  input: '$products',
                  as: 'product',
                  in: { $multiply: ['$$product.price', '$$product.soldQuantity'] }
                }
              }
            }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ])
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};