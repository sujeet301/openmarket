import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    minlength: [3, 'Product name must be at least 3 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    set: val => Math.round(val * 100) / 100 // Round to 2 decimal places
  },
  
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative'],
    validate: {
      validator: function(val) {
        return val > this.price;
      },
      message: 'Compare at price must be greater than regular price'
    }
  },
  
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    select: false // Hide from regular queries
  },
  
  // Tax and Shipping
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  taxClass: {
    type: String,
    enum: ['standard', 'reduced', 'zero', 'none'],
    default: 'standard'
  },
  
  // Categories
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  
  // Seller
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Product seller is required']
  },
  
  // Inventory
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  availableQuantity: {
    type: Number,
    default: function() {
      return this.quantity - this.reservedQuantity;
    }
  },
  
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0
  },
  
  trackQuantity: {
    type: Boolean,
    default: true
  },
  
  allowBackorders: {
    type: Boolean,
    default: false
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String,
    title: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  videos: [{
    url: String,
    type: {
      type: String,
      enum: ['youtube', 'vimeo', 'upload'],
      default: 'upload'
    },
    thumbnail: String,
    title: String
  }],
  
  // Variants
  hasVariants: {
    type: Boolean,
    default: false
  },
  
  variantAttributes: [{
    name: {
      type: String,
      enum: ['size', 'color', 'material', 'style', 'other']
    },
    values: [String]
  }],
  
  variants: [{
    sku: {
      type: String,
      required: true
    },
    attributes: {
      type: Map,
      of: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    images: [{
      url: String,
      publicId: String
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Digital Products
  isDigital: {
    type: Boolean,
    default: false
  },
  
  digitalFile: {
    url: String,
    publicId: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    downloadLimit: Number,
    expiryDays: Number
  },
  
  // Product Options (for simple products with options like gift wrapping)
  options: [{
    name: String,
    values: [{
      value: String,
      price: Number,
      sku: String
    }]
  }],
  
  // SEO
  seo: {
    title: {
      type: String,
      maxlength: 60
    },
    description: {
      type: String,
      maxlength: 160
    },
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    canonical: String,
    noIndex: {
      type: Boolean,
      default: false
    }
  },
  
  // Specifications/Attributes
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isFilterable: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Brand
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  
  // Shipping
  shipping: {
    weight: {
      type: Number,
      min: 0,
      default: 0
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz'],
      default: 'kg'
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['cm', 'm', 'in'],
        default: 'cm'
      }
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard'
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      min: 0,
      default: 0
    },
    additionalShippingCost: {
      type: Number,
      min: 0,
      default: 0
    },
    shippingRestrictions: {
      countries: [String],
      zones: [String],
      excludeCountries: [String]
    }
  },
  
  // Ratings and Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: val => Math.round(val * 10) / 10 // Round to 1 decimal
  },
  
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'pending', 'rejected', 'archived'],
    default: 'draft'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isNewProduct: {
    type: Boolean,
    default: true
  },
  
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  isBestSeller: {
    type: Boolean,
    default: false
  },
  
  publishedAt: Date,
  
  // Sales
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  
  discountStartDate: Date,
  discountEndDate: Date,
  
  salePrice: {
    type: Number,
    min: 0
  },
  
  // Related Products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  upsellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  crossSellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Product Groups/Bundles
  isBundle: {
    type: Boolean,
    default: false
  },
  
  bundleItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    discount: {
      type: Number,
      default: 0
    }
  }],
  
  // Warranty
  warranty: {
    type: String,
    enum: ['none', 'manufacturer', 'extended', 'seller'],
    default: 'none'
  },
  
  warrantyPeriod: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    }
  },
  
  warrantyDetails: String,
  
  // Returns
  returnPolicy: {
    type: String,
    enum: ['no-returns', '7-days', '15-days', '30-days', '60-days'],
    default: '15-days'
  },
  
  returnPolicyDetails: String,
  
  // Metadata
  views: {
    type: Number,
    default: 0
  },
  
  clicks: {
    type: Number,
    default: 0
  },
  
  wishlistCount: {
    type: Number,
    default: 0
  },
  
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Admin/Review
  adminNotes: {
    type: String,
    select: false
  },
  
  rejectionReason: String,
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  
  // Settings
  settings: {
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    maxOrderQuantity: {
      type: Number,
      default: 99,
      min: 1
    },
    allowGiftWrap: {
      type: Boolean,
      default: false
    },
    giftWrapPrice: Number,
    allowCustomization: Boolean,
    customizationFields: [{
      name: String,
      type: String,
      required: Boolean,
      options: [String]
    }]
  },
  
  // External/Import
  externalId: String,
  externalUrl: String,
  
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
      ret.availableQuantity = Math.max(0, ret.quantity - (ret.reservedQuantity || 0));
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    getters: true
  }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', 'tags': 'text' });
productSchema.index({ sku: 1 }, { unique: true });  
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1, rating: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ 'shipping.shippingClass': 1 });
productSchema.index({ brand: 1 });

// Compound indexes for common queries
productSchema.index({ category: 1, price: 1, rating: -1 });
productSchema.index({ seller: 1, isActive: 1, quantity: 1 });
productSchema.index({ status: 1, reviewedBy: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for inStock status
productSchema.virtual('inStock').get(function() {
  return this.quantity > 0 || this.allowBackorders;
});

// Virtual for lowStock status
productSchema.virtual('isLowStock').get(function() {
  return this.trackQuantity && this.quantity <= this.lowStockThreshold;
});

// Virtual for final price (considering sales)
productSchema.virtual('finalPrice').get(function() {
  if (this.isOnSale && this.salePrice) {
    return this.salePrice;
  }
  return this.price;
});

// Virtual for review count
productSchema.virtual('reviewCount').get(function() {
  return this.numReviews;
});

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  return this.rating;
});

// Virtual for product URL
productSchema.virtual('productUrl').get(function() {
  return `/product/${this.seo?.slug || this._id}`;
});

// Pre-save middleware
productSchema.pre('save', async function(next) {
  // Update timestamps
  this.updatedAt = Date.now();
  
  // Generate slug if not provided
  if (!this.seo?.slug && this.name) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for unique slug
    while (await mongoose.model('Product').exists({ 'seo.slug': slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.seo = this.seo || {};
    this.seo.slug = slug;
  }
  
  // Calculate sale price if on sale
  if (this.isOnSale && this.discount && this.discount > 0) {
    if (this.discountType === 'percentage') {
      this.salePrice = this.price * (1 - this.discount / 100);
    } else {
      this.salePrice = Math.max(0, this.price - this.discount);
    }
  }
  
  // Update available quantity
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  
  // Set isNewProduct flag based on creation date
  if (this.isNewProduct && (!this.createdAt || Date.now() - this.createdAt < 7 * 24 * 60 * 60 * 1000)) {
    this.isNewProduct = true;
  }
  
  next();
});

// Pre-update middleware
productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Methods
productSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ 
    product: this._id, 
    status: 'approved' 
  });
  
  this.numReviews = reviews.length;
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = totalRating / reviews.length;
    
    // Update rating distribution
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      this.ratingDistribution[review.rating] = (this.ratingDistribution[review.rating] || 0) + 1;
    });
  } else {
    this.rating = 0;
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  return this.save();
};

productSchema.methods.decreaseQuantity = function(quantity) {
  if (this.quantity < quantity) {
    throw new Error('Insufficient quantity');
  }
  this.quantity -= quantity;
  this.soldQuantity += quantity;
  return this.save();
};

productSchema.methods.reserveQuantity = function(quantity) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient available quantity');
  }
  this.reservedQuantity += quantity;
  return this.save();
};

productSchema.methods.releaseReservedQuantity = function(quantity) {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  return this.save();
};

productSchema.methods.addToWishlist = function() {
  this.wishlistCount += 1;
  return this.save();
};

productSchema.methods.removeFromWishlist = function() {
  this.wishlistCount = Math.max(0, this.wishlistCount - 1);
  return this.save();
};

productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.incrementClicks = function() {
  this.clicks += 1;
  return this.save();
};

// Static methods
productSchema.statics.getFeaturedProducts = function(limit = 8) {
  return this.find({ 
    isActive: true, 
    isFeatured: true,
    status: 'published'
  })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.getNewArrivals = function(limit = 8) {
  return this.find({ 
    isActive: true, 
    isNewProduct: true,
    status: 'published'
  })
    .sort('-createdAt')
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.getBestSellers = function(limit = 8) {
  return this.find({ 
    isActive: true, 
    isBestSeller: true,
    status: 'published'
  })
    .sort('-soldQuantity')
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.getOnSale = function(limit = 8) {
  const now = new Date();
  return this.find({ 
    isActive: true, 
    isOnSale: true,
    status: 'published',
    $or: [
      { discountStartDate: { $lte: now } },
      { discountStartDate: null }
    ],
    $or: [
      { discountEndDate: { $gte: now } },
      { discountEndDate: null }
    ]
  })
    .sort('-discount')
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.getRelatedProducts = function(productId, categoryId, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    category: categoryId,
    isActive: true,
    status: 'published'
  })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    status: 'published',
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('category', 'name slug')
    .populate('seller', 'name sellerDetails.storeName');
};

productSchema.statics.getInventoryAlerts = function(sellerId, threshold = 5) {
  return this.find({
    seller: sellerId,
    trackQuantity: true,
    quantity: { $lte: threshold },
    isActive: true
  }).select('name sku quantity images lowStockThreshold');
};

productSchema.statics.getCategoryStats = async function() {
  return this.aggregate([
    { $match: { isActive: true, status: 'published' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
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
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: 1,
        maxPrice: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Export the model
const Product = mongoose.model('Product', productSchema);

export default Product;