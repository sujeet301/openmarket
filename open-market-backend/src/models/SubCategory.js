import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [50, 'Subcategory name cannot exceed 50 characters']
  },
  
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Parent category is required']
  },
  
  image: {
    url: String,
    publicId: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  productCount: {
    type: Number,
    default: 0
  },
  
  attributes: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select'],
      default: 'text'
    },
    options: [String]
  }]
}, {
  timestamps: true
});

// Indexes
subCategorySchema.index({ category: 1, name: 1 }, { unique: true });
subCategorySchema.index({ slug: 1 });
subCategorySchema.index({ isActive: 1 });

// Pre-save middleware
subCategorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Methods
subCategorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  this.productCount = await Product.countDocuments({ 
    subCategory: this._id,
    isActive: true 
  });
  return this.save();
};

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;