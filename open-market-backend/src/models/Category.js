import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    minlength: [2, 'Category name must be at least 2 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  level: {
    type: Number,
    default: 0,
    min: 0
  },
  
  path: {
    type: String,
    default: ''
  },
  
  // Media
  image: {
    url: String,
    publicId: String,
    alt: String
  },
  
  icon: {
    type: String,
    comment: 'Font Awesome or custom icon class'
  },
  
  banner: {
    url: String,
    publicId: String
  },
  
  // Display Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  showInMenu: {
    type: Boolean,
    default: true
  },
  
  showInHome: {
    type: Boolean,
    default: false
  },
  
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
    slug: String,
    canonical: String,
    noIndex: {
      type: Boolean,
      default: false
    }
  },
  
  // Attributes for products in this category
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect', 'color', 'size'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String],
    filterable: {
      type: Boolean,
      default: true
    },
    searchable: {
      type: Boolean,
      default: true
    },
    unit: String,
    description: String
  }],
  
  // Filters for category page
  filters: [{
    name: String,
    type: {
      type: String,
      enum: ['price', 'brand', 'rating', 'attribute'],
      default: 'attribute'
    },
    attribute: String,
    options: [mongoose.Schema.Types.Mixed],
    order: Number
  }],
  
  // Commission settings (if different from default)
  commission: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  
  // Statistics
  productCount: {
    type: Number,
    default: 0
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Subcategories count (virtual)
  subcategoryCount: {
    type: Number,
    default: 0
  },
  
  // Breadcrumb
  breadcrumbs: [{
    name: String,
    slug: String,
    _id: mongoose.Schema.Types.ObjectId
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1, level: 1 });
categorySchema.index({ isActive: 1, showInMenu: 1 });
categorySchema.index({ isFeatured: 1 });

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for products in this category
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Pre-save middleware
categorySchema.pre('save', async function(next) {
  // Generate slug
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Set level based on parent
  if (this.parent) {
    const parentCategory = await mongoose.model('Category').findById(this.parent);
    if (parentCategory) {
      this.level = parentCategory.level + 1;
      this.path = parentCategory.path ? `${parentCategory.path}/${this.slug}` : this.slug;
      
      // Set breadcrumbs
      this.breadcrumbs = [
        ...(parentCategory.breadcrumbs || []),
        {
          name: parentCategory.name,
          slug: parentCategory.slug,
          _id: parentCategory._id
        }
      ];
    }
  } else {
    this.level = 0;
    this.path = this.slug;
    this.breadcrumbs = [];
  }
  
  next();
});

// Pre-update middleware
categorySchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = update.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Methods
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  this.productCount = await Product.countDocuments({ 
    category: this._id,
    isActive: true,
    status: 'published'
  });
  return this.save();
};

categorySchema.methods.getFullPath = function() {
  if (this.breadcrumbs && this.breadcrumbs.length > 0) {
    return this.breadcrumbs.map(b => b.slug).join('/') + '/' + this.slug;
  }
  return this.slug;
};

categorySchema.methods.getAncestors = async function() {
  if (!this.parent) return [];
  
  const ancestors = [];
  let current = await mongoose.model('Category').findById(this.parent);
  
  while (current) {
    ancestors.unshift(current);
    if (!current.parent) break;
    current = await mongoose.model('Category').findById(current.parent);
  }
  
  return ancestors;
};

categorySchema.methods.getDescendants = async function() {
  const descendants = await mongoose.model('Category').find({
    path: { $regex: `^${this.path}` }
  });
  return descendants.filter(c => c._id.toString() !== this._id.toString());
};

// Static methods
categorySchema.statics.buildTree = async function(parent = null, level = 0) {
  const categories = await this.find({ 
    parent: parent ? parent._id : null,
    isActive: true 
  }).sort('displayOrder name');
  
  const tree = [];
  
  for (const category of categories) {
    const children = await this.buildTree(category, level + 1);
    tree.push({
      ...category.toObject(),
      level,
      children
    });
  }
  
  return tree;
};

categorySchema.statics.getMenuCategories = function() {
  return this.find({
    isActive: true,
    showInMenu: true,
    level: { $lte: 1 }
  })
    .populate({
      path: 'children',
      match: { isActive: true, showInMenu: true },
      options: { sort: { displayOrder: 1, name: 1 } }
    })
    .sort('displayOrder name');
};

categorySchema.statics.getFeaturedCategories = function(limit = 6) {
  return this.find({
    isActive: true,
    isFeatured: true
  })
    .limit(limit)
    .sort('displayOrder name');
};

categorySchema.statics.getCategoryBreadcrumbs = async function(categoryId) {
  const category = await this.findById(categoryId);
  if (!category) return [];
  
  return category.breadcrumbs;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;