import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { APIFeatures } from '../utils/apiFeatures.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Category.find({ isActive: true }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const categories = await features.query
      .populate('parent', 'name slug')
      .populate('children', 'name slug');

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

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate({
        path: 'children',
        match: { isActive: true },
        select: 'name slug image productCount'
      });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Increment view count
    category.viewCount += 1;
    await category.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    // Check if category with same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } 
    });

    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }

    // Add created by
    req.body.createdBy = req.user.id;

    const category = await Category.create(req.body);

    // If parent exists, update parent's subcategory count
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $inc: { subcategoryCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if new name conflicts with existing category
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        throw new AppError('Category with this name already exists', 400);
      }
    }

    // Add updated by
    req.body.updatedBy = req.user.id;

    // If parent is being changed
    if (req.body.parent && req.body.parent !== category.parent?.toString()) {
      // Decrease count from old parent
      if (category.parent) {
        await Category.findByIdAndUpdate(category.parent, {
          $inc: { subcategoryCount: -1 }
        });
      }
      
      // Increase count in new parent
      if (req.body.parent) {
        await Category.findByIdAndUpdate(req.body.parent, {
          $inc: { subcategoryCount: 1 }
        });
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: category._id,
      isActive: true 
    });

    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category that has ${productCount} active products. Move products to another category first.`,
        400
      );
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ 
      parent: category._id 
    });

    if (subcategoryCount > 0) {
      throw new AppError(
        `Cannot delete category that has ${subcategoryCount} subcategories. Delete or move subcategories first.`,
        400
      );
    }

    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();

    // Decrease parent's subcategory count
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $inc: { subcategoryCount: -1 }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res, next) => {
  try {
    const tree = await Category.buildTree();

    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category attributes
// @route   GET /api/categories/:id/attributes
// @access  Public
export const getCategoryAttributes = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.status(200).json({
      success: true,
      data: category.attributes || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
export const getFeaturedCategories = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const categories = await Category.getFeaturedCategories(limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu categories
// @route   GET /api/categories/menu
// @access  Public
export const getMenuCategories = async (req, res, next) => {
  try {
    const categories = await Category.getMenuCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breadcrumbs
// @route   GET /api/categories/:id/breadcrumbs
// @access  Public
export const getCategoryBreadcrumbs = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const breadcrumbs = await category.getAncestors();
    
    breadcrumbs.push(category);

    res.status(200).json({
      success: true,
      data: breadcrumbs.map(c => ({
        _id: c._id,
        name: c.name,
        slug: c.slug
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update categories
// @route   PUT /api/categories/bulk
// @access  Private/Admin
export const bulkUpdateCategories = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { id, data }

    const operations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { ...update.data, updatedBy: req.user.id } }
      }
    }));

    const result = await Category.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} categories successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private/Admin
export const reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body; // Array of { id, displayOrder }

    const operations = categories.map(cat => ({
      updateOne: {
        filter: { _id: cat.id },
        update: { $set: { displayOrder: cat.displayOrder, updatedBy: req.user.id } }
      }
    }));

    const result = await Category.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Reordered ${result.modifiedCount} categories successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category statistics
// @route   GET /api/categories/stats
// @access  Private/Admin
export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Category.aggregate([
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
          slug: 1,
          level: 1,
          isActive: 1,
          productCount: { $size: '$products' },
          activeProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.isActive', true] }
              }
            }
          },
          totalRevenue: {
            $sum: '$products.price'
          }
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import categories from CSV/JSON
// @route   POST /api/categories/import
// @access  Private/Admin
export const importCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const catData of categories) {
      try {
        // Check if category exists by slug
        let category = await Category.findOne({ 
          $or: [
            { slug: catData.slug },
            { name: catData.name }
          ]
        });

        if (category) {
          // Update existing
          await Category.findByIdAndUpdate(category._id, {
            ...catData,
            updatedBy: req.user.id
          });
          results.updated++;
        } else {
          // Create new
          await Category.create({
            ...catData,
            createdBy: req.user.id
          });
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          data: catData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export categories
// @route   GET /api/categories/export
// @access  Private/Admin
export const exportCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate('parent', 'name slug')
      .lean();

    // Format categories for export
    const exportData = categories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parent: cat.parent?.name || '',
      level: cat.level,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      showInMenu: cat.showInMenu,
      isFeatured: cat.isFeatured
    }));

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category status
// @route   PUT /api/categories/:id/toggle-status
// @access  Private/Admin
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.user.id;
    await category.save();

    // If deactivating, also deactivate all subcategories?
    if (!category.isActive) {
      await Category.updateMany(
        { parent: category._id },
        { isActive: false, updatedBy: req.user.id }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        _id: category._id,
        name: category.name,
        isActive: category.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subcategories
// @route   GET /api/categories/:id/subcategories
// @access  Public
export const getSubcategories = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const subcategories = await Category.find({ 
      parent: category._id,
      isActive: true 
    }).select('name slug image productCount');

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category products
// @route   GET /api/categories/:id/products
// @access  Public
export const getCategoryProducts = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const features = new APIFeatures(
      Product.find({ 
        category: category._id,
        isActive: true,
        status: 'published'
      }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query
      .populate('seller', 'name sellerDetails.storeName')
      .select('name price images rating numReviews');

    const total = await features.count();

    // Update category view count
    category.viewCount += 1;
    await category.save({ validateBeforeSave: false });

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

// @desc    Add attribute to category
// @route   POST /api/categories/:id/attributes
// @access  Private/Admin
export const addCategoryAttribute = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const { name, type, required, options, filterable, searchable, unit, description } = req.body;

    // Check if attribute already exists
    const attributeExists = category.attributes.some(
      attr => attr.name.toLowerCase() === name.toLowerCase()
    );

    if (attributeExists) {
      throw new AppError('Attribute with this name already exists', 400);
    }

    category.attributes.push({
      name,
      type,
      required,
      options,
      filterable,
      searchable,
      unit,
      description
    });

    category.updatedBy = req.user.id;
    await category.save();

    res.status(201).json({
      success: true,
      data: category.attributes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category attribute
// @route   PUT /api/categories/:id/attributes/:attributeId
// @access  Private/Admin
export const updateCategoryAttribute = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const attribute = category.attributes.id(req.params.attributeId);

    if (!attribute) {
      throw new AppError('Attribute not found', 404);
    }

    Object.assign(attribute, req.body);
    category.updatedBy = req.user.id;
    await category.save();

    res.status(200).json({
      success: true,
      data: category.attributes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category attribute
// @route   DELETE /api/categories/:id/attributes/:attributeId
// @access  Private/Admin
export const deleteCategoryAttribute = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    category.attributes = category.attributes.filter(
      attr => attr._id.toString() !== req.params.attributeId
    );

    category.updatedBy = req.user.id;
    await category.save();

    res.status(200).json({
      success: true,
      data: category.attributes
    });
  } catch (error) {
    next(error);
  }
};