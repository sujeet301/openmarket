import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    minlength: [10, 'Comment must be at least 10 characters']
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    caption: String
  }],
  
  videos: [{
    url: String,
    type: {
      type: String,
      enum: ['youtube', 'vimeo', 'upload'],
      default: 'upload'
    },
    thumbnail: String
  }],
  
  // Pros and Cons
  pros: [String],
  cons: [String],
  
  // Additional Information
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  
  purchaseDate: Date,
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  isVerifiedBuyer: {
    type: Boolean,
    default: false
  },
  
  // Interactions
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  notHelpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  
  // Reports
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'offensive', 'fake', 'other']
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Seller Response
  sellerResponse: {
    comment: {
      type: String,
      maxlength: 1000
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      comment: String,
      editedAt: Date
    }]
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam'],
    default: 'pending'
  },
  
  moderationNotes: String,
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: Date,
  
  // Flags
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    comment: String,
    rating: Number,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ status: 1, reportCount: -1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  if (total === 0) return 0;
  return Math.round((this.helpfulCount / total) * 100);
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Update helpful count
  this.helpfulCount = this.helpful.length;
  this.notHelpfulCount = this.notHelpful.length;
  this.reportCount = this.reportedBy.length;
  
  next();
});

// Pre-update middleware
reviewSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$push) {
    if (update.$push.helpful) {
      update.$inc = update.$inc || {};
      update.$inc.helpfulCount = 1;
    }
    if (update.$push.notHelpful) {
      update.$inc = update.$inc || {};
      update.$inc.notHelpfulCount = 1;
    }
    if (update.$push['reportedBy']) {
      update.$inc = update.$inc || {};
      update.$inc.reportCount = 1;
    }
  }
  if (update.$pull) {
    if (update.$pull.helpful) {
      update.$inc = update.$inc || {};
      update.$inc.helpfulCount = -1;
    }
    if (update.$pull.notHelpful) {
      update.$inc = update.$inc || {};
      update.$inc.notHelpfulCount = -1;
    }
  }
  next();
});

// Methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.includes(userId)) {
    this.helpful.push(userId);
    if (this.notHelpful.includes(userId)) {
      this.notHelpful = this.notHelpful.filter(id => id.toString() !== userId.toString());
    }
    return this.save();
  }
  return this;
};

reviewSchema.methods.markNotHelpful = function(userId) {
  if (!this.notHelpful.includes(userId)) {
    this.notHelpful.push(userId);
    if (this.helpful.includes(userId)) {
      this.helpful = this.helpful.filter(id => id.toString() !== userId.toString());
    }
    return this.save();
  }
  return this;
};

reviewSchema.methods.report = function(userId, reason, comment = '') {
  const alreadyReported = this.reportedBy.some(
    report => report.user.toString() === userId.toString()
  );
  
  if (!alreadyReported) {
    this.reportedBy.push({
      user: userId,
      reason,
      comment,
      date: new Date()
    });
    return this.save();
  }
  return this;
};

reviewSchema.methods.addSellerResponse = function(comment, sellerId) {
  this.sellerResponse = {
    comment,
    respondedBy: sellerId,
    respondedAt: new Date()
  };
  return this.save();
};

reviewSchema.methods.updateSellerResponse = function(comment) {
  if (this.sellerResponse) {
    this.sellerResponse.editHistory.push({
      comment: this.sellerResponse.comment,
      editedAt: new Date()
    });
    this.sellerResponse.comment = comment;
    this.sellerResponse.isEdited = true;
    return this.save();
  }
  return this;
};

reviewSchema.methods.moderate = function(status, notes, moderatorId) {
  this.status = status;
  this.moderationNotes = notes;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  return this.save();
};

// Static methods
reviewSchema.statics.getProductReviews = function(productId, filters = {}) {
  const query = { 
    product: productId,
    status: 'approved',
    ...filters
  };
  
  return this.find(query)
    .populate('user', 'name profilePicture')
    .populate('sellerResponse.respondedBy', 'name')
    .sort('-createdAt');
};

reviewSchema.statics.getUserReviews = function(userId) {
  return this.find({ user: userId })
    .populate('product', 'name images sku')
    .sort('-createdAt');
};

reviewSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'name email')
    .populate('product', 'name seller')
    .sort('createdAt');
};

reviewSchema.statics.getReportedReviews = function() {
  return this.find({ reportCount: { $gt: 0 } })
    .populate('user', 'name email')
    .populate('product', 'name seller')
    .populate('reportedBy.user', 'name email')
    .sort('-reportCount');
};

reviewSchema.statics.calculateProductRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  return stats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;