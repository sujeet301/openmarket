import mongoose from 'mongoose';
import crypto from 'crypto';

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Customer Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  guestEmail: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  guestName: String,
  
  guestPhone: String,
  
  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    name: {
      type: String,
      required: true
    },
    
    sku: String,
    
    price: {
      type: Number,
      required: true,
      min: 0
    },
    
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    total: {
      type: Number,
      required: true,
      min: 0
    },
    
    discount: {
      amount: Number,
      percentage: Number,
      couponCode: String
    },
    
    tax: {
      rate: Number,
      amount: Number
    },
    
    commission: {
      rate: Number,
      amount: Number
    },
    
    sellerEarnings: {
      type: Number,
      min: 0
    },
    
    variant: {
      name: String,
      value: String,
      sku: String
    },
    
    image: String,
    
    // Item Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
      default: 'pending'
    },
    
    statusHistory: [{
      status: String,
      date: {
        type: Date,
        default: Date.now
      },
      comment: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
    // Shipping Details
    trackingNumber: String,
    trackingUrl: String,
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date,
    
    // Cancellation
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Return/Refund
    returnRequest: {
      requestedAt: Date,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
      },
      approvedAt: Date,
      completedAt: Date,
      refundAmount: Number,
      refundId: String,
      notes: String
    },
    
    // Review
    isReviewed: {
      type: Boolean,
      default: false
    },
    
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  }],
  
  // Addresses
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    landmark: String,
    phoneNumber: {
      type: String,
      required: true
    },
    email: String,
    fullName: String
  },
  
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phoneNumber: String,
    email: String,
    fullName: String,
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'cod', 'paypal', 'razorpay', 'stripe'],
    required: [true, 'Payment method is required']
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  paymentDetails: {
    transactionId: String,
    paymentId: String,
    payerId: String,
    orderId: String,
    signature: String,
    method: String,
    bank: String,
    card: {
      last4: String,
      brand: String,
      expiryMonth: String,
      expiryYear: String
    },
    upi: {
      vpa: String
    },
    wallet: String,
    paymentTime: Date,
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    status: String,
    response: mongoose.Schema.Types.Mixed
  },
  
  paymentHistory: [{
    status: String,
    date: Date,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Financial Summary
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  couponCode: String,
  
  couponDiscount: {
    type: Number,
    default: 0
  },
  
  giftWrapAmount: {
    type: Number,
    default: 0
  },
  
  handlingFee: {
    type: Number,
    default: 0
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  
  amountDue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Seller Payouts
  sellerPayouts: [{
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    commission: Number,
    commissionAmount: Number,
    netAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending'
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout'
    },
    paidAt: Date
  }],
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, payment pending
      'confirmed',         // Payment confirmed
      'processing',        // Being processed
      'shipped',           // Shipped
      'partially_shipped', // Some items shipped
      'delivered',         // Delivered
      'cancelled',         // Cancelled
      'partially_cancelled', // Some items cancelled
      'refunded',          // Fully refunded
      'partially_refunded', // Some items refunded
      'returned',          // Returned
      'on_hold',           // On hold
      'failed'             // Payment failed
    ],
    default: 'pending'
  },
  
  statusHistory: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    comment: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Shipping
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'free'],
    default: 'standard'
  },
  
  shippingCarrier: String,
  
  shippingService: String,
  
  shippingTrackingNumber: String,
  
  shippingTrackingUrl: String,
  
  shippingLabel: {
    url: String,
    printed: Boolean,
    printedAt: Date
  },
  
  estimatedDeliveryDate: Date,
  
  actualDeliveryDate: Date,
  
  // Dates
  orderDate: {
    type: Date,
    default: Date.now
  },
  
  paymentDate: Date,
  
  shippedDate: Date,
  
  deliveredDate: Date,
  
  cancelledDate: Date,
  
  completedDate: Date,
  
  // Cancellation
  cancellationReason: String,
  
  cancellationNote: String,
  
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Return
  returnReason: String,
  
  returnNote: String,
  
  returnRequestedAt: Date,
  
  returnApprovedAt: Date,
  
  returnCompletedAt: Date,
  
  // Notes
  customerNotes: String,
  
  adminNotes: String,
  
  internalNotes: String,
  
  // Flags
  isGuest: {
    type: Boolean,
    default: false
  },
  
  isGift: {
    type: Boolean,
    default: false
  },
  
  giftMessage: String,
  
  giftWrap: {
    type: Boolean,
    default: false
  },
  
  giftWrapType: String,
  
  isRushOrder: {
    type: Boolean,
    default: false
  },
  
  isInsurance: {
    type: Boolean,
    default: false
  },
  
  isSignatureRequired: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  ipAddress: String,
  
  userAgent: String,
  
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'admin', 'api'],
    default: 'website'
  },
  
  referrer: String,
  
  campaign: {
    source: String,
    medium: String,
    term: String,
    content: String,
    name: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, status: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.zipCode': 1 });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1 });

// Virtual for total items
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for unique sellers
orderSchema.virtual('sellerCount').get(function() {
  const sellers = new Set(this.items.map(item => item.seller.toString()));
  return sellers.size;
});

// Pre-save middleware
orderSchema.pre('save', async function(next) {
  // Generate order number
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    
    this.orderNumber = `ORD${year}${month}${day}${(count + 1).toString().padStart(6, '0')}`;
  }
  
  // Generate invoice number
  if (!this.invoiceNumber && this.paymentStatus === 'completed') {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await mongoose.model('Order').countDocuments({
      invoiceNumber: { $exists: true }
    });
    
    this.invoiceNumber = `INV${year}${month}${(count + 1).toString().padStart(8, '0')}`;
  }
  
  // Calculate amount due
  this.amountDue = this.totalAmount - this.amountPaid;
  
  // Add status to history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      comment: `Order status changed to ${this.status}`
    });
  }
  
  // Set date based on status
  if (this.status === 'shipped' && !this.shippedDate) {
    this.shippedDate = new Date();
  }
  
  if (this.status === 'delivered' && !this.deliveredDate) {
    this.deliveredDate = new Date();
  }
  
  if (this.status === 'cancelled' && !this.cancelledDate) {
    this.cancelledDate = new Date();
  }
  
  // Set payment date
  if (this.paymentStatus === 'completed' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  next();
});

// Pre-update middleware
orderSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update.status && !update.$push?.statusHistory) {
    update.$push = update.$push || {};
    update.$push.statusHistory = {
      status: update.status,
      date: new Date(),
      comment: `Order status updated to ${update.status}`
    };
  }
  
  next();
});

// Methods
orderSchema.methods.updateItemStatus = function(itemId, status, comment = '', userId = null) {
  const item = this.items.id(itemId);
  if (!item) throw new Error('Item not found');
  
  item.status = status;
  item.statusHistory.push({
    status,
    date: new Date(),
    comment,
    updatedBy: userId
  });
  
  // Update overall order status based on items
  this.updateOverallStatus();
  
  return this.save();
};

orderSchema.methods.updateOverallStatus = function() {
  const itemStatuses = this.items.map(item => item.status);
  
  if (itemStatuses.every(status => status === 'delivered')) {
    this.status = 'delivered';
    this.deliveredDate = new Date();
  } else if (itemStatuses.every(status => ['cancelled', 'refunded'].includes(status))) {
    this.status = 'cancelled';
    this.cancelledDate = new Date();
  } else if (itemStatuses.some(status => status === 'shipped')) {
    this.status = itemStatuses.some(status => status === 'pending') ? 'partially_shipped' : 'shipped';
    this.shippedDate = new Date();
  } else if (itemStatuses.some(status => status === 'processing')) {
    this.status = 'processing';
  } else if (itemStatuses.every(status => status === 'confirmed')) {
    this.status = 'confirmed';
  }
  
  return this;
};

orderSchema.methods.calculateSellerEarnings = function() {
  const sellerEarnings = {};
  
  this.items.forEach(item => {
    const sellerId = item.seller.toString();
    if (!sellerEarnings[sellerId]) {
      sellerEarnings[sellerId] = {
        seller: item.seller,
        amount: 0,
        commission: 0,
        commissionAmount: 0,
        netAmount: 0
      };
    }
    
    const commissionRate = item.commission?.rate || 10; // Default 10%
    const commissionAmount = (item.total * commissionRate) / 100;
    const netAmount = item.total - commissionAmount;
    
    sellerEarnings[sellerId].amount += item.total;
    sellerEarnings[sellerId].commission = commissionRate;
    sellerEarnings[sellerId].commissionAmount += commissionAmount;
    sellerEarnings[sellerId].netAmount += netAmount;
  });
  
  this.sellerPayouts = Object.values(sellerEarnings);
  return this.sellerPayouts;
};

orderSchema.methods.processRefund = function(itemId, amount, reason, userId) {
  const item = itemId ? this.items.id(itemId) : null;
  
  if (item) {
    item.status = 'refunded';
    item.returnRequest = {
      requestedAt: new Date(),
      reason,
      status: 'completed',
      completedAt: new Date(),
      refundAmount: amount || item.total
    };
    
    item.statusHistory.push({
      status: 'refunded',
      date: new Date(),
      comment: `Refund processed: ${reason}`
    });
  }
  
  // Update payment status
  const refundedAmount = amount || this.totalAmount;
  this.amountPaid -= refundedAmount;
  
  if (this.amountPaid <= 0) {
    this.paymentStatus = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }
  
  this.paymentHistory.push({
    status: 'refunded',
    date: new Date(),
    note: `Refund of ${refundedAmount} processed: ${reason}`,
    updatedBy: userId
  });
  
  this.updateOverallStatus();
  
  return this.save();
};

orderSchema.methods.addTrackingInfo = function(itemId, trackingNumber, trackingUrl, carrier) {
  const item = this.items.id(itemId);
  if (!item) throw new Error('Item not found');
  
  item.trackingNumber = trackingNumber;
  item.trackingUrl = trackingUrl;
  item.shippingCarrier = carrier;
  item.status = 'shipped';
  item.shippedAt = new Date();
  
  this.updateOverallStatus();
  
  return this.save();
};

// Static methods
orderSchema.statics.getUserOrders = function(userId, page = 1, limit = 10) {
  return this.find({ user: userId })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('items.product', 'name images');
};

orderSchema.statics.getSellerOrders = function(sellerId, filters = {}) {
  const query = {
    'items.seller': sellerId,
    ...filters
  };
  
  return this.find(query)
    .sort('-createdAt')
    .populate('user', 'name email')
    .populate('items.product', 'name images');
};

orderSchema.statics.getOrderStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalItems: { $sum: '$totalItems' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };
};

orderSchema.statics.getRevenueByDay = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
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
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        date: { $first: '$createdAt' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

const Order = mongoose.model('Order', orderSchema);

export default Order;