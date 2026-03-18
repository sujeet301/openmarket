import cloudinary from 'cloudinary';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private
export const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    const { folder = 'general', resourceType = 'auto' } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: `openmarket/${folder}`,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    // Clean up local file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
export const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('Please upload files', 400);
    }

    const { folder = 'general' } = req.body;
    const uploadPromises = [];
    const uploadedFiles = [];

    // Upload each file to Cloudinary
    for (const file of req.files) {
      const uploadPromise = cloudinary.v2.uploader.upload(file.path, {
        folder: `openmarket/${folder}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
      }).then(result => {
        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
        // Delete local file
        fs.unlinkSync(file.path);
        return result;
      }).catch(error => {
        // Delete local file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw error;
      });

      uploadPromises.push(uploadPromise);
    }

    await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      data: uploadedFiles
    });
  } catch (error) {
    // Clean up any remaining local files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

// @desc    Upload base64 image
// @route   POST /api/upload/base64
// @access  Private
export const uploadBase64 = async (req, res, next) => {
  try {
    const { image, folder = 'general' } = req.body;

    if (!image) {
      throw new AppError('Please provide base64 image', 400);
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(image, {
      folder: `openmarket/${folder}`,
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/upload/:publicId
// @access  Private
export const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw new AppError('Please provide public ID', 400);
    }

    // Delete from Cloudinary
    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      throw new AppError('Failed to delete file', 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's uploaded files
// @route   GET /api/upload/my-files
// @access  Private
export const getUploadedFiles = async (req, res, next) => {
  try {
    // Search Cloudinary for user's files
    // Note: This assumes files are tagged with user ID
    const result = await cloudinary.v2.api.resources_by_tag(
      `user_${req.user.id}`,
      {
        max_results: 100,
        resource_type: 'image'
      }
    );

    const files = result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
      createdAt: resource.created_at
    }));

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product image
// @route   POST /api/upload/product
// @access  Private/Seller
export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    const { productId, isPrimary } = req.body;

    // Upload to Cloudinary with product tag
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'openmarket/products',
      tags: [`product_${productId}`, `user_${req.user.id}`],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: isPrimary === 'true'
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'openmarket/avatars',
      tags: [`user_${req.user.id}`],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    // Update user's profile picture
    await User.findByIdAndUpdate(req.user.id, {
      profilePicture: result.secure_url
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload store logo
// @route   POST /api/upload/store-logo
// @access  Private/Seller
export const uploadStoreLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'openmarket/stores',
      tags: [`store_${req.user.id}`],
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    // Update store logo
    await User.findByIdAndUpdate(req.user.id, {
      'sellerDetails.storeLogo': result.secure_url
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload category image
// @route   POST /api/upload/category
// @access  Private/Admin
export const uploadCategoryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    const { categoryId } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'openmarket/categories',
      tags: [`category_${categoryId}`],
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    // Update category image
    await Category.findByIdAndUpdate(categoryId, {
      image: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload review image
// @route   POST /api/upload/review
// @access  Private
export const uploadReviewImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    const { reviewId } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'openmarket/reviews',
      tags: [`review_${reviewId}`, `user_${req.user.id}`],
      transformation: [
        { width: 600, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};