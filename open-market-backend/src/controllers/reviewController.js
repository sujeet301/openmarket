import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const features = new APIFeatures(
      Review.find({ 
        product: productId, 
        status: 'approved' 
      }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query
      .populate('user', 'name profilePicture')
      .populate('sellerResponse.respondedBy', 'name sellerDetails.storeName');

    const total = await features.count();

    // Get rating summary
    const ratingSummary = await Review.aggregate([
      { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      ratingSummary: ratingSummary[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name profilePicture')
      .populate('product', 'name images')
      .populate('sellerResponse.respondedBy', 'name sellerDetails.storeName')
      .populate('helpful', 'name')
      .populate('notHelpful', 'name');

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images, pros, cons } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this product', 400);
    }

    // Check if user purchased this product
    const hasPurchased = await Order.exists({
      user: req.user.id,
      'items.product': productId,
      status: 'delivered'
    });

    // Get order details for verified purchase
    let orderItem = null;
    if (hasPurchased) {
      const order = await Order.findOne({
        user: req.user.id,
        'items.product': productId,
        status: 'delivered'
      });
      
      if (order) {
        orderItem = order.items.find(
          item => item.product.toString() === productId
        );
      }
    }

    // Create review
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      order: orderItem?._id,
      rating,
      title,
      comment,
      images,
      pros,
      cons,
      isVerifiedPurchase: !!hasPurchased,
      isVerifiedBuyer: !!hasPurchased,
      status: 'pending' // Requires moderation
    });

    // Emit socket event for admin notification
    if (req.io) {
      req.io.to('admin').emit('new_review', {
        reviewId: review._id,
        productId,
        rating,
        user: req.user.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and awaiting moderation',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this review', 403);
    }

    // Save edit history
    review.editHistory.push({
      comment: review.comment,
      rating: review.rating,
      editedAt: new Date()
    });

    // Update fields
    const allowedUpdates = ['rating', 'title', 'comment', 'images', 'pros', 'cons'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    review.isEdited = true;
    review.status = 'pending'; // Require re-moderation after edit

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to delete this review', 403);
    }

    await review.remove();

    // Update product rating
    const product = await Product.findById(review.product);
    if (product) {
      await product.updateRating();
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await review.markHelpful(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as not helpful
// @route   POST /api/reviews/:id/not-helpful
// @access  Private
export const markNotHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await review.markNotHelpful(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Review marked as not helpful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res, next) => {
  try {
    const { reason, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await review.report(req.user.id, reason, comment);

    // Notify admins
    if (req.io) {
      req.io.to('admin').emit('review_reported', {
        reviewId: review._id,
        reportedBy: req.user.id,
        reason
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add seller response
// @route   POST /api/reviews/:id/respond
// @access  Private/Seller
export const addSellerResponse = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if user is the seller of this product
    const product = await Product.findById(review.product);
    if (!product || (product.seller.toString() !== req.user.id && req.user.role !== 'admin')) {
      throw new AppError('You do not have permission to respond to this review', 403);
    }

    if (review.sellerResponse && review.sellerResponse.comment) {
      // Update existing response
      await review.updateSellerResponse(comment);
    } else {
      // Add new response
      await review.addSellerResponse(comment, req.user.id);
    }

    // Notify user
    if (req.io) {
      req.io.to(`user:${review.user}`).emit('seller_responded', {
        reviewId: review._id,
        productId: product._id
      });
    }

    res.status(200).json({
      success: true,
      data: review.sellerResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate review (Admin only)
// @route   PUT /api/reviews/:id/moderate
// @access  Private/Admin
export const moderateReview = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await review.moderate(status, notes, req.user.id);

    // If approved, update product rating
    if (status === 'approved') {
      const product = await Product.findById(review.product);
      if (product) {
        await product.updateRating();
      }

      // Notify user that their review was approved
      if (req.io) {
        req.io.to(`user:${review.user}`).emit('review_approved', {
          reviewId: review._id,
          productId: review.product
        });
      }
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending reviews (Admin only)
// @route   GET /api/reviews/admin/pending
// @access  Private/Admin
export const getPendingReviews = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Review.find({ status: 'pending' }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query
      .populate('user', 'name email')
      .populate('product', 'name images seller');

    const total = await features.count();

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reported reviews (Admin only)
// @route   GET /api/reviews/admin/reported
// @access  Private/Admin
export const getReportedReviews = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Review.find({ reportCount: { $gt: 0 } }),
      req.query
    )
      .filter()
      .sort('-reportCount')
      .limitFields()
      .paginate();

    const reviews = await features.query
      .populate('user', 'name email')
      .populate('product', 'name images seller')
      .populate('reportedBy.user', 'name email');

    const total = await features.count();

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/me
// @access  Private
export const getMyReviews = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Review.find({ user: req.user.id }),
      req.query
    )
      .filter()
      .sort('-createdAt')
      .limitFields()
      .paginate();

    const reviews = await features.query
      .populate('product', 'name images');

    const total = await features.count();

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review statistics for a product
// @route   GET /api/reviews/stats/:productId
// @access  Public
export const getReviewStats = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $facet: {
          ratingDistribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          overview: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                totalHelpful: { $sum: '$helpfulCount' },
                withImages: {
                  $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
                },
                withVideos: {
                  $sum: { $cond: [{ $gt: [{ $size: '$videos' }, 0] }, 1, 0] }
                }
              }
            }
          ],
          recentTrends: [
            {
              $group: {
                _id: {
                  month: { $month: '$createdAt' },
                  year: { $year: '$createdAt' }
                },
                count: { $sum: 1 },
                averageRating: { $avg: '$rating' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        distribution: stats[0]?.ratingDistribution || [],
        overview: stats[0]?.overview[0] || {
          averageRating: 0,
          totalReviews: 0,
          totalHelpful: 0,
          withImages: 0,
          withVideos: 0
        },
        trends: stats[0]?.recentTrends || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote review
// @route   POST /api/reviews/:id/upvote
// @access  Private
export const upvoteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Remove from downvotes if present
    if (review.notHelpful.includes(req.user.id)) {
      review.notHelpful = review.notHelpful.filter(
        id => id.toString() !== req.user.id
      );
    }

    // Add to upvotes if not already present
    if (!review.helpful.includes(req.user.id)) {
      review.helpful.push(req.user.id);
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpful: review.helpful.length,
        notHelpful: review.notHelpful.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Downvote review
// @route   POST /api/reviews/:id/downvote
// @access  Private
export const downvoteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Remove from upvotes if present
    if (review.helpful.includes(req.user.id)) {
      review.helpful = review.helpful.filter(
        id => id.toString() !== req.user.id
      );
    }

    // Add to downvotes if not already present
    if (!review.notHelpful.includes(req.user.id)) {
      review.notHelpful.push(req.user.id);
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpful: review.helpful.length,
        notHelpful: review.notHelpful.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured reviews
// @route   GET /api/reviews/featured
// @access  Public
export const getFeaturedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ 
      isFeatured: true,
      status: 'approved'
    })
      .limit(6)
      .populate('user', 'name profilePicture')
      .populate('product', 'name images')
      .sort('-helpfulCount');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk moderate reviews (Admin only)
// @route   POST /api/reviews/admin/bulk-moderate
// @access  Private/Admin
export const bulkModerateReviews = async (req, res, next) => {
  try {
    const { reviewIds, status, notes } = req.body;

    const operations = reviewIds.map(reviewId => ({
      updateOne: {
        filter: { _id: reviewId },
        update: {
          $set: {
            status,
            moderationNotes: notes,
            moderatedBy: req.user.id,
            moderatedAt: new Date()
          }
        }
      }
    }));

    const result = await Review.bulkWrite(operations);

    // Update product ratings for approved reviews
    if (status === 'approved') {
      const reviews = await Review.find({ _id: { $in: reviewIds } });
      const productIds = [...new Set(reviews.map(r => r.product.toString()))];

      for (const productId of productIds) {
        const product = await Product.findById(productId);
        if (product) {
          await product.updateRating();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} reviews successfully`
    });
  } catch (error) {
    next(error);
  }
};