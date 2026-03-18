import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import mongoose from 'mongoose';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const features = new APIFeatures(Product.find({ isActive: true }), req.query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('seller', 'name sellerDetails.storeName');

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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('subCategory', 'name slug')
      .populate('seller', 'name email sellerDetails.storeName sellerDetails.storeLogo sellerDetails.rating')
      .populate({
        path: 'reviews',
        match: { status: 'approved' },
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Increment view count
    product.views += 1;
    await product.save({ validateBeforeSave: false });

    // Add to user's recently viewed if logged in
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          recentlyViewed: {
            product: product._id,
            viewedAt: Date.now()
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Seller
export const createProduct = async (req, res, next) => {
  try {
    // Add seller to request body
    req.body.seller = req.user.id;

    // Generate SKU if not provided
    if (!req.body.sku) {
      const category = await Category.findById(req.body.category);
      const count = await Product.countDocuments();
      req.body.sku = `${category?.name?.substring(0, 3).toUpperCase() || 'PRD'}${(count + 1).toString().padStart(6, '0')}`;
    }

    const product = await Product.create(req.body);

    // Update seller's product count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'sellerDetails.totalProducts': 1 }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Seller
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user is seller of this product or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this product', 403);
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Seller
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user is seller of this product or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to delete this product', 403);
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    // Update seller's product count
    await User.findByIdAndUpdate(product.seller, {
      $inc: { 'sellerDetails.totalProducts': -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller products
// @route   GET /api/products/seller/me
// @access  Private/Seller
export const getSellerProducts = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Product.find({ seller: req.user.id }),
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

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const addProductReview = async (req, res, next) => {
  try {
    const { rating, comment, title, images } = req.body;
    const productId = req.params.id;

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

    // Create review
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase: !!hasPurchased
    });

    // Update product ratings
    const product = await Product.findById(productId);
    const reviews = await Review.find({ product: productId, status: 'approved' });
    
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    product.rating = avgRating;
    product.numReviews = reviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Review.find({ 
        product: req.params.id,
        status: 'approved' 
      }).populate('user', 'name profilePicture'),
      req.query
    )
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query;
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

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, rating, sort } = req.query;

    let query = { isActive: true };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    let productsQuery = Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'name sellerDetails.storeName');

    // Sorting
    if (sort) {
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      const sortField = sort.replace('-', '');
      productsQuery = productsQuery.sort({ [sortField]: sortOrder });
    } else {
      productsQuery = productsQuery.sort('-createdAt');
    }

    const products = await productsQuery;

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ 
      isActive: true,
      isFeatured: true 
    })
      .limit(8)
      .populate('category', 'name slug')
      .populate('seller', 'name sellerDetails.storeName');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
      isFeatured: true
    })
      .limit(4)
      .populate('category', 'name slug')
      .populate('seller', 'name sellerDetails.storeName');

    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      data: relatedProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update products
// @route   PUT /api/products/bulk/update
// @access  Private/Seller
export const bulkUpdateProducts = async (req, res, next) => {
  try {
    const { productIds, updateData } = req.body;

    const result = await Product.updateMany(
      { 
        _id: { $in: productIds },
        seller: req.user.id 
      },
      updateData,
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories with counts
// @route   GET /api/products/categories/stats
// @access  Public
export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
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

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product featured status
// @route   PUT /api/products/:id/toggle-featured
// @access  Private/Admin
export const toggleFeatured = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({
      success: true,
      data: {
        isFeatured: product.isFeatured
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product inventory alerts
// @route   GET /api/products/inventory/alerts
// @access  Private/Seller
export const getInventoryAlerts = async (req, res, next) => {
  try {
    const threshold = req.query.threshold || 10;

    const products = await Product.find({
      seller: req.user.id,
      quantity: { $lte: threshold },
      isActive: true
    }).select('name sku quantity images');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product inventory
// @route   PUT /api/products/:id/inventory
// @access  Private/Seller
export const updateInventory = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id) {
      throw new AppError('You do not have permission to update this product', 403);
    }

    if (operation === 'add') {
      product.quantity += quantity;
    } else if (operation === 'subtract') {
      if (product.quantity < quantity) {
        throw new AppError('Insufficient quantity', 400);
      }
      product.quantity -= quantity;
    } else {
      product.quantity = quantity;
    }

    await product.save();

    res.status(200).json({
      success: true,
      data: {
        quantity: product.quantity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Seller
export const uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this product', 403);
    }

    // This would integrate with your file upload middleware
    // Assuming files are uploaded and URLs are in req.files
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        isPrimary: product.images.length === 0 // First image is primary
      }));

      product.images.push(...newImages);
      await product.save();
    }

    res.status(200).json({
      success: true,
      data: product.images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Seller
export const deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this product', 403);
    }

    product.images = product.images.filter(
      img => img._id.toString() !== req.params.imageId
    );

    // If primary image was deleted, set first image as primary
    if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.status(200).json({
      success: true,
      data: product.images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set primary image
// @route   PUT /api/products/:id/images/:imageId/primary
// @access  Private/Seller
export const setPrimaryImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this product', 403);
    }

    // Remove primary flag from all images
    product.images.forEach(img => {
      img.isPrimary = false;
    });

    // Set primary flag on selected image
    const image = product.images.id(req.params.imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }
    image.isPrimary = true;

    await product.save();

    res.status(200).json({
      success: true,
      data: product.images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product analytics
// @route   GET /api/products/:id/analytics
// @access  Private/Seller
export const getProductAnalytics = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to view this product', 403);
    }

    // Get view stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get review stats
    const reviewStats = await Review.aggregate([
      { $match: { product: product._id } },
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

    // Get order stats
    const orderStats = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        views: {
          total: product.views,
          // Add more view analytics if you track daily views
        },
        reviews: reviewStats[0] || {
          averageRating: 0,
          totalReviews: 0,
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0
        },
        sales: orderStats[0] || {
          totalSold: 0,
          totalRevenue: 0,
          totalOrders: 0
        },
        inventory: {
          current: product.quantity,
          sold: product.soldQuantity
        }
      }
    });
  } catch (error) {
    next(error);
  }
};