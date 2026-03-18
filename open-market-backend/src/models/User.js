import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default in queries
  },
  
  role: {
    type: String,
    enum: {
      values: ['client', 'seller', 'admin'],
      message: 'Role must be either client, seller, or admin'
    },
    default: 'client'
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: 'default-avatar.jpg',
    get: function(avatar) {
      // Return full URL for avatar
      if (avatar && !avatar.startsWith('http')) {
        return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/avatars/${avatar}`;
      }
      return avatar;
    }
  },
  
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! Please enter 10 digits`
    }
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return v < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
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
      required: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit PIN code']
    },
    country: {
      type: String,
      default: 'India'
    },
    landmark: String,
    phoneNumber: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Seller Specific Information
  sellerDetails: {
    storeName: {
      type: String,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    storeDescription: {
      type: String,
      maxlength: [500, 'Store description cannot exceed 500 characters']
    },
    storeLogo: {
      type: String,
      default: 'default-store-logo.jpg'
    },
    storeBanner: {
      type: String,
      default: 'default-store-banner.jpg'
    },
    gstNumber: {
      type: String,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
    },
    panNumber: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    },
    aadhaarNumber: {
      type: String,
      select: false,
      match: [/^[0-9]{12}$/, 'Please enter a valid Aadhaar number']
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    bankDetails: {
      accountNumber: {
        type: String,
        select: false
      },
      confirmAccountNumber: {
        type: String,
        select: false,
        validate: {
          validator: function(v) {
            return v === this.bankDetails?.accountNumber;
          },
          message: 'Account numbers do not match'
        }
      },
      ifscCode: {
        type: String,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
      },
      accountHolderName: String,
      bankName: String,
      branchName: String,
      upiId: {
        type: String,
        match: [/^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{3,}$/, 'Please enter a valid UPI ID']
      }
    },
    documents: [{
      type: {
        type: String,
        enum: ['gst_certificate', 'pan_card', 'aadhaar_card', 'business_proof', 'bank_statement']
      },
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      verifiedAt: Date,
      remarks: String
    }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending'
    },
    verificationSubmittedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    commission: {
      type: Number,
      default: 10, // Default 10% commission
      min: 0,
      max: 100
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: val => Math.round(val * 10) / 10 // Round to 1 decimal
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    monthlyRevenue: [{
      month: String,
      year: Number,
      amount: Number
    }],
    payoutSettings: {
      payoutSchedule: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly'
      },
      minimumPayout: {
        type: Number,
        default: 1000
      },
      autoPayout: {
        type: Boolean,
        default: true
      }
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    tags: [String]
  },
  
  // Client Specific Information
  clientDetails: {
    preferences: {
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }],
      brands: [String],
      size: String,
      color: String,
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        push: {
          type: Boolean,
          default: true
        }
      }
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  
  // Shopping Related
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity cannot be less than 1'],
      max: [99, 'Quantity cannot exceed 99']
    },
    variant: {
      name: String,
      value: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  recentlyViewed: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  twoFactorSecret: {
    type: String,
    select: false
  },
  
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  blockedReason: String,
  
  blockedAt: Date,
  
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  deactivatedAt: Date,
  
  deactivationReason: String,
  
  // Activity Tracking
  lastLogin: Date,
  
  lastLoginIP: String,
  
  lastActive: Date,
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: Date,
  
  // Tokens for various purposes
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  passwordResetToken: String,
  passwordResetExpire: Date,
  
  passwordChangedAt: Date,
  
  refreshToken: {
    type: String,
    select: false
  },
  
  refreshTokenExpire: Date,
  
  // Device Information
  devices: [{
    deviceId: String,
    deviceType: String,
    browser: String,
    os: String,
    ip: String,
    lastUsed: Date,
    isTrusted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['order', 'promotion', 'alert', 'system']
    },
    title: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Subscription
  newsletter: {
    type: Boolean,
    default: true
  },
  
  marketingEmails: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  referralEarnings: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpire;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpire;
      delete ret.refreshToken;
      delete ret.twoFactorSecret;
      delete ret.backupCodes;
      delete ret.bankDetails?.accountNumber;
      delete ret.bankDetails?.confirmAccountNumber;
      delete ret.sellerDetails?.aadhaarNumber;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    getters: true
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });  
userSchema.index({ role: 1 });
userSchema.index({ 'sellerDetails.verificationStatus': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'addresses.zipCode': 1 });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for remaining lock time
userSchema.virtual('lockRemaining').get(function() {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return Math.ceil((this.lockUntil - Date.now()) / (60 * 1000)); // in minutes
  }
  return 0;
});

// Virtual for seller store URL
userSchema.virtual('storeUrl').get(function() {
  if (this.role === 'seller' && this.sellerDetails?.storeName) {
    return `/store/${this._id}`;
  }
  return null;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set passwordChangedAt for security
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for email verification token
userSchema.pre('save', function(next) {
  if (this.isNew && !this.emailVerified) {
    // Generate email verification token for new users
    this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  }
  next();
});

// Pre-save middleware for referral code
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    // Generate unique referral code
    let code;
    let exists;
    do {
      code = 'OM' + Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await mongoose.model('User').exists({ referralCode: code });
    } while (exists);
    this.referralCode = code;
  }
  next();
});

// Pre-update middleware
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

userSchema.methods.addToRecentlyViewed = function(productId) {
  // Remove if already exists
  this.recentlyViewed = this.recentlyViewed.filter(
    item => item.product.toString() !== productId.toString()
  );
  
  // Add to beginning
  this.recentlyViewed.unshift({
    product: productId,
    viewedAt: Date.now()
  });
  
  // Keep only last 10 items
  if (this.recentlyViewed.length > 10) {
    this.recentlyViewed = this.recentlyViewed.slice(0, 10);
  }
  
  return this.save();
};

userSchema.methods.addNotification = function(notification) {
  this.notifications.unshift(notification);
  
  // Keep only last 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
  
  return this.save();
};

userSchema.methods.markNotificationsAsRead = function(notificationIds = []) {
  if (notificationIds.length === 0) {
    // Mark all as read
    this.notifications.forEach(n => { n.read = true; });
  } else {
    // Mark specific notifications as read
    this.notifications.forEach(n => {
      if (notificationIds.includes(n._id.toString())) {
        n.read = true;
      }
    });
  }
  
  return this.save();
};

userSchema.methods.addDevice = function(deviceInfo) {
  const existingDevice = this.devices.find(d => d.deviceId === deviceInfo.deviceId);
  
  if (existingDevice) {
    existingDevice.lastUsed = Date.now();
  } else {
    this.devices.unshift({
      ...deviceInfo,
      lastUsed: Date.now()
    });
    
    // Keep only last 5 devices
    if (this.devices.length > 5) {
      this.devices = this.devices.slice(0, 5);
    }
  }
  
  return this.save();
};

userSchema.methods.trustDevice = function(deviceId) {
  const device = this.devices.find(d => d.deviceId === deviceId);
  if (device) {
    device.isTrusted = true;
  }
  return this.save();
};

userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase()
    });
  }
  this.backupCodes = codes;
  return this.save();
};

userSchema.methods.verifyBackupCode = function(code) {
  const backupCode = this.backupCodes.find(
    bc => bc.code === code && !bc.used
  );
  
  if (backupCode) {
    backupCode.used = true;
    this.save();
    return true;
  }
  
  return false;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findVerifiedSellers = function() {
  return this.find({
    role: 'seller',
    'sellerDetails.verificationStatus': 'verified',
    isActive: true,
    isBlocked: false
  });
};

userSchema.statics.getDashboardStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    clients: 0,
    sellers: 0,
    admins: 0,
    pendingVerifications: 0,
    blockedUsers: 0,
    activeToday: 0
  };
  
  stats.forEach(stat => {
    result[stat._id + 's'] = stat.count;
    result.total += stat.count;
  });
  
  // Count pending verifications
  result.pendingVerifications = await this.countDocuments({
    role: 'seller',
    'sellerDetails.verificationStatus': 'pending'
  });
  
  // Count blocked users
  result.blockedUsers = await this.countDocuments({ isBlocked: true });
  
  // Count active today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  result.activeToday = await this.countDocuments({
    lastActive: { $gte: today }
  });
  
  return result;
};

// Export the model
const User = mongoose.model('User', userSchema);

export default User;