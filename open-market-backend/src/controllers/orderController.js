import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      totalAmount,
      couponCode,
      customerNotes,
      isGift,
      giftMessage
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      throw new AppError('No order items provided', 400);
    }

    // Check stock availability and calculate seller earnings
    const orderItems = [];
    const sellerEarnings = {};

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (product.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for product: ${product.name}`, 400);
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;

      // Calculate commission (default 10%)
      const commissionRate = product.commission || 10;
      const commissionAmount = (itemTotal * commissionRate) / 100;
      const sellerNetAmount = itemTotal - commissionAmount;

      // Track seller earnings
      const sellerId = product.seller.toString();
      if (!sellerEarnings[sellerId]) {
        sellerEarnings[sellerId] = {
          seller: product.seller,
          amount: 0,
          commission: commissionRate,
          commissionAmount: 0,
          netAmount: 0
        };
      }

      sellerEarnings[sellerId].amount += itemTotal;
      sellerEarnings[sellerId].commissionAmount += commissionAmount;
      sellerEarnings[sellerId].netAmount += sellerNetAmount;

      // Prepare order item
      orderItems.push({
        product: product._id,
        seller: product.seller,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        discount: item.discount,
        tax: {
          rate: product.taxRate || 0,
          amount: (itemTotal * (product.taxRate || 0)) / 100
        },
        commission: {
          rate: commissionRate,
          amount: commissionAmount
        },
        sellerEarnings: sellerNetAmount,
        image: product.images.find(img => img.isPrimary)?.url || product.images[0]?.url,
        status: 'pending'
      });

      // Reserve stock
      product.reservedQuantity += item.quantity;
      await product.save();
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      couponCode,
      customerNotes,
      isGift: isGift || false,
      giftMessage,
      sellerPayouts: Object.values(sellerEarnings),
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'processing'
    });

    // Emit socket event
    if (req.io) {
      req.io.emit('new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount
      });
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Order.find({ user: req.user.id }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const orders = await features.query
      .populate('items.product', 'name images')
      .sort('-createdAt');

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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name images description')
      .populate('items.seller', 'name email sellerDetails.storeName');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if user owns this order or is admin/seller
    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isSeller = req.user.role === 'seller' && 
      order.items.some(item => item.seller._id.toString() === req.user.id);

    if (!isOwner && !isAdmin && !isSeller) {
      throw new AppError('You do not have permission to view this order', 403);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Seller/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment, itemId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isSeller = req.user.role === 'seller' && 
      order.items.some(item => item.seller.toString() === req.user.id);

    if (!isAdmin && !isSeller) {
      throw new AppError('You do not have permission to update this order', 403);
    }

    // If updating specific item
    if (itemId) {
      const item = order.items.id(itemId);
      if (!item) {
        throw new AppError('Order item not found', 404);
      }

      // Check if seller owns this item
      if (!isAdmin && item.seller.toString() !== req.user.id) {
        throw new AppError('You do not have permission to update this item', 403);
      }

      item.status = status;
      item.statusHistory.push({
        status,
        date: new Date(),
        comment: comment || `Item status updated to ${status}`,
        updatedBy: req.user.id
      });

      // Update product stock if delivered
      if (status === 'delivered') {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity -= item.quantity;
          product.reservedQuantity -= item.quantity;
          product.soldQuantity += item.quantity;
          await product.save();
        }
        item.deliveredAt = new Date();
      }

      // Update order overall status
      await order.updateOverallStatus();
    } else {
      // Update entire order status
      order.status = status;
      
      // Add to status history
      order.statusHistory.push({
        status,
        date: new Date(),
        comment: comment || `Order status updated to ${status}`,
        updatedBy: req.user.id
      });

      // Update dates based on status
      if (status === 'shipped' && !order.shippedDate) {
        order.shippedDate = new Date();
      } else if (status === 'delivered' && !order.deliveredDate) {
        order.deliveredDate = new Date();
        
        // Update all items as delivered
        order.items.forEach(item => {
          item.status = 'delivered';
          item.deliveredAt = new Date();
        });
      } else if (status === 'cancelled' && !order.cancelledDate) {
        order.cancelledDate = new Date();
        
        // Release reserved stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.reservedQuantity -= item.quantity;
            await product.save();
          }
        }
      }
    }

    await order.save();

    // Emit socket event
    if (req.io) {
      req.io.to(`order:${order._id}`).emit('order_updated', {
        orderId: order._id,
        status: order.status,
        updatedBy: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to cancel this order', 403);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError(`Order cannot be cancelled in ${order.status} status`, 400);
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledDate = new Date();
    order.cancellationReason = reason;
    order.cancelledBy = req.user.id;

    order.statusHistory.push({
      status: 'cancelled',
      date: new Date(),
      comment: reason || 'Order cancelled by customer',
      updatedBy: req.user.id
    });

    // Update all items as cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      item.cancelledAt = new Date();
      item.cancellationReason = reason;
    });

    // Release reserved stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.reservedQuantity -= item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/orders
// @access  Private/Seller
export const getSellerOrders = async (req, res, next) => {
  try {
    const query = {
      'items.seller': req.user.id
    };

    // Filter by status
    if (req.query.status) {
      query['items.status'] = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const features = new APIFeatures(
      Order.find(query),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const orders = await features.query
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    // Calculate seller totals
    orders.forEach(order => {
      order.sellerItems = order.items.filter(
        item => item.seller.toString() === req.user.id
      );
      order.sellerTotal = order.sellerItems.reduce(
        (sum, item) => sum + item.total, 0
      );
    });

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

// @desc    Get order analytics
// @route   GET /api/orders/admin/analytics
// @access  Private/Admin
export const getOrderAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Overall stats
    const overallStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Orders by payment method
    const ordersByPaymentMethod = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Daily orders for chart
    const dailyOrders = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          date: { $first: '$createdAt' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          quantity: 1,
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItems: 0,
          completedOrders: 0,
          cancelledOrders: 0
        },
        byStatus: ordersByStatus,
        byPaymentMethod: ordersByPaymentMethod,
        dailyTrend: dailyOrders,
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process refund
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
export const processRefund = async (req, res, next) => {
  try {
    const { itemId, amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await order.processRefund(itemId, amount, reason, req.user.id);

    // Update product quantities if refunding returned items
    if (itemId) {
      const item = order.items.id(itemId);
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add tracking information
// @route   POST /api/orders/:id/tracking
// @access  Private/Seller
export const addTrackingInfo = async (req, res, next) => {
  try {
    const { itemId, trackingNumber, trackingUrl, carrier } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await order.addTrackingInfo(itemId, trackingNumber, trackingUrl, carrier);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, transactionId, paymentDetails } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.paymentStatus = paymentStatus;
    if (transactionId) {
      order.paymentDetails.transactionId = transactionId;
    }
    if (paymentDetails) {
      order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };
    }

    if (paymentStatus === 'completed') {
      order.paymentDate = new Date();
      
      // Generate invoice number
      if (!order.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await Order.countDocuments({ invoiceNumber: { $exists: true } });
        order.invoiceNumber = `INV${year}${month}${(count + 1).toString().padStart(8, '0')}`;
      }
    }

    order.paymentHistory.push({
      status: paymentStatus,
      date: new Date(),
      note: `Payment status updated to ${paymentStatus}`,
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
export const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name sku');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check permissions
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to download this invoice', 403);
    }

    // Generate PDF invoice (you would need a PDF generation library)
    // For now, return order data that can be used to generate PDF on frontend
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order status history
// @route   GET /api/orders/:id/status-history
// @access  Private
export const getOrderStatusHistory = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('statusHistory items.status');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        orderHistory: order.statusHistory,
        itemHistory: order.items.map(item => ({
          itemId: item._id,
          status: item.status,
          history: item.statusHistory || []
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder previous order
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reorder = async (req, res, next) => {
  try {
    const existingOrder = await Order.findById(req.params.id);

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    if (existingOrder.user.toString() !== req.user.id) {
      throw new AppError('You do not have permission to reorder this order', 403);
    }

    // Create new order items from existing order
    const items = existingOrder.items.map(item => ({
      productId: item.product,
      quantity: item.quantity
    }));

    // Use the create order function with the items
    req.body = {
      items,
      shippingAddress: existingOrder.shippingAddress,
      billingAddress: existingOrder.billingAddress,
      paymentMethod: existingOrder.paymentMethod
    };

    // Call createOrder function
    await createOrder(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Estimate delivery date
// @route   GET /api/orders/estimate-delivery
// @access  Public
export const estimateDelivery = async (req, res, next) => {
  try {
    const { pincode, items } = req.query;

    // Calculate estimated delivery based on pincode and items
    // This would integrate with a shipping API in production
    const estimatedDays = 3; // Default to 3 days
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

    res.status(200).json({
      success: true,
      data: {
        estimatedDays,
        estimatedDate,
        message: `Estimated delivery in ${estimatedDays} business days`
      }
    });
  } catch (error) {
    next(error);
  }
};