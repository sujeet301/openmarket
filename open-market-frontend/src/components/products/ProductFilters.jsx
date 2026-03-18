import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineFilter, 
  HiOutlineX, 
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineAdjustments,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineCurrencyDollar,
  HiOutlineColorSwatch,
  HiOutlineCube,
  HiOutlineCog,
  HiOutlineCheck,
  HiOutlineMinus,
  HiOutlinePlus
} from 'react-icons/hi';

const ProductFilters = ({
  filters = {},
  onFilterChange,
  onClose,
  isMobile = false,
  categories = [],
  brands = [],
  colors = [],
  sizes = [],
  priceRange = { min: 0, max: 1000 },
  showSearch = true,
  showCategories = true,
  showBrands = true,
  showColors = true,
  showSizes = true,
  showPriceRange = true,
  showRating = true,
  showSort = true,
  showTags = true,
  showClearAll = true,
  showApplyButton = false,
  darkMode = false,
  initialExpandedSections = ['categories', 'price', 'rating'], // Renamed from expandedSections
  maxHeight = '600px'
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    categories: initialExpandedSections.includes('categories'),
    price: initialExpandedSections.includes('price'),
    rating: initialExpandedSections.includes('rating'),
    brands: initialExpandedSections.includes('brands'),
    colors: initialExpandedSections.includes('colors'),
    sizes: initialExpandedSections.includes('sizes'),
    tags: initialExpandedSections.includes('tags')
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [priceSlider, setPriceSlider] = useState({
    min: filters.minPrice || priceRange.min,
    max: filters.maxPrice || priceRange.max
  });

  // Default categories if none provided
  const defaultCategories = [
    { id: 'electronics', name: 'Electronics', count: 245 },
    { id: 'fashion', name: 'Fashion', count: 567 },
    { id: 'home', name: 'Home & Living', count: 189 },
    { id: 'beauty', name: 'Beauty', count: 123 },
    { id: 'sports', name: 'Sports', count: 78 },
    { id: 'books', name: 'Books', count: 345 },
    { id: 'toys', name: 'Toys & Games', count: 92 },
    { id: 'automotive', name: 'Automotive', count: 56 }
  ];

  // Default brands
  const defaultBrands = [
    { id: 'nike', name: 'Nike', count: 89 },
    { id: 'adidas', name: 'Adidas', count: 67 },
    { id: 'apple', name: 'Apple', count: 45 },
    { id: 'samsung', name: 'Samsung', count: 34 },
    { id: 'sony', name: 'Sony', count: 23 },
    { id: 'lg', name: 'LG', count: 19 }
  ];

  // Default colors
  const defaultColors = [
    { name: 'Black', value: '#000000', count: 156 },
    { name: 'White', value: '#FFFFFF', count: 143 },
    { name: 'Red', value: '#FF0000', count: 67 },
    { name: 'Blue', value: '#0000FF', count: 89 },
    { name: 'Green', value: '#00FF00', count: 45 },
    { name: 'Yellow', value: '#FFFF00', count: 34 },
    { name: 'Purple', value: '#800080', count: 23 },
    { name: 'Orange', value: '#FFA500', count: 19 }
  ];

  // Default sizes
  const defaultSizes = [
    { name: 'XS', count: 45 },
    { name: 'S', count: 67 },
    { name: 'M', count: 89 },
    { name: 'L', count: 78 },
    { name: 'XL', count: 56 },
    { name: 'XXL', count: 34 }
  ];

  const activeCategories = categories.length > 0 ? categories : defaultCategories;
  const activeBrands = brands.length > 0 ? brands : defaultBrands;
  const activeColors = colors.length > 0 ? colors : defaultColors;
  const activeSizes = sizes.length > 0 ? sizes : defaultSizes;

  // Filter categories by search
  const filteredCategories = activeCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCategories = showMoreCategories 
    ? filteredCategories 
    : filteredCategories.slice(0, 5);

  const filteredBrands = activeBrands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedBrands = showMoreBrands 
    ? filteredBrands 
    : filteredBrands.slice(0, 5);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    const newFilters = { ...localFilters };
    
    if (type === 'category') {
      newFilters.category = newFilters.category === value ? undefined : value;
    } else if (type === 'brand') {
      if (!newFilters.brands) newFilters.brands = [];
      if (newFilters.brands.includes(value)) {
        newFilters.brands = newFilters.brands.filter(b => b !== value);
      } else {
        newFilters.brands = [...newFilters.brands, value];
      }
    } else if (type === 'color') {
      if (!newFilters.colors) newFilters.colors = [];
      if (newFilters.colors.includes(value)) {
        newFilters.colors = newFilters.colors.filter(c => c !== value);
      } else {
        newFilters.colors = [...newFilters.colors, value];
      }
    } else if (type === 'size') {
      if (!newFilters.sizes) newFilters.sizes = [];
      if (newFilters.sizes.includes(value)) {
        newFilters.sizes = newFilters.sizes.filter(s => s !== value);
      } else {
        newFilters.sizes = [...newFilters.sizes, value];
      }
    } else if (type === 'price') {
      newFilters.minPrice = value.min;
      newFilters.maxPrice = value.max;
    } else if (type === 'rating') {
      newFilters.minRating = newFilters.minRating === value ? undefined : value;
    } else if (type === 'sort') {
      newFilters.sort = value;
    } else if (type === 'inStock') {
      newFilters.inStock = value;
    } else if (type === 'onSale') {
      newFilters.onSale = value;
    }

    setLocalFilters(newFilters);
    
    if (!showApplyButton) {
      onFilterChange(newFilters);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleClearAll = () => {
    setLocalFilters({});
    setPriceSlider({ min: priceRange.min, max: priceRange.max });
    onFilterChange({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (type, value) => {
    const newPrice = { ...priceSlider, [type]: value };
    setPriceSlider(newPrice);
    handleFilterChange('price', newPrice);
  };

  // Animation variants
  const sectionVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: {
          duration: 0.3
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        }
      }
    }
  };

  const filterItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    hover: { 
      scale: 1.02,
      x: 5,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  const colorVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.2, rotate: 5 },
    selected: { 
      scale: 1.1,
      boxShadow: "0 0 0 2px #3b82f6, 0 0 0 4px rgba(59,130,246,0.2)"
    }
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <div className="flex items-center">
          <HiOutlineAdjustments className={`w-5 h-5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {showClearAll && Object.keys(localFilters).length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAll}
              className={`text-sm px-3 py-1 rounded-full flex items-center ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <HiOutlineRefresh className="w-4 h-4 mr-1" />
              Clear All
            </motion.button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <HiOutlineX className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <HiOutlineSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search filters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
          </div>
        </div>
      )}

      {/* Filter Sections - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ maxHeight }}>
        {/* Categories */}
        {showCategories && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Categories
              </h4>
              {expandedSections.categories ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.categories && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2 overflow-hidden"
                >
                  {displayedCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onClick={() => handleFilterChange('category', category.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        localFilters.category === category.id
                          ? darkMode
                            ? 'bg-primary-600 bg-opacity-20 text-primary-400'
                            : 'bg-primary-50 text-primary-600'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="text-sm">{category.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {category.count}
                      </span>
                    </motion.button>
                  ))}

                  {filteredCategories.length > 5 && (
                    <button
                      onClick={() => setShowMoreCategories(!showMoreCategories)}
                      className={`text-sm mt-2 flex items-center ${
                        darkMode ? 'text-primary-400' : 'text-primary-600'
                      } hover:underline`}
                    >
                      {showMoreCategories ? 'Show less' : `Show ${filteredCategories.length - 5} more`}
                      {showMoreCategories ? (
                        <HiOutlineChevronUp className="ml-1 w-4 h-4" />
                      ) : (
                        <HiOutlineChevronDown className="ml-1 w-4 h-4" />
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Price Range */}
        {showPriceRange && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Price Range
              </h4>
              {expandedSections.price ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.price && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-4"
                >
                  {/* Slider */}
                  <div className="px-2">
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={priceSlider.min}
                      onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={priceSlider.max}
                      onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                      className="w-full accent-primary-600 mt-2"
                    />
                  </div>

                  {/* Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Min
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={priceSlider.min}
                          onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                          className={`w-full pl-7 pr-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        />
                      </div>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      -
                    </span>
                    <div className="flex-1">
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Max
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={priceSlider.max}
                          onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 0)}
                          className={`w-full pl-7 pr-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Brands */}
        {showBrands && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('brands')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Brands
              </h4>
              {expandedSections.brands ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.brands && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2"
                >
                  {displayedBrands.map((brand) => (
                    <motion.button
                      key={brand.id}
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onClick={() => handleFilterChange('brand', brand.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        localFilters.brands?.includes(brand.id)
                          ? darkMode
                            ? 'bg-primary-600 bg-opacity-20 text-primary-400'
                            : 'bg-primary-50 text-primary-600'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="text-sm">{brand.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {brand.count}
                      </span>
                    </motion.button>
                  ))}

                  {filteredBrands.length > 5 && (
                    <button
                      onClick={() => setShowMoreBrands(!showMoreBrands)}
                      className={`text-sm mt-2 flex items-center ${
                        darkMode ? 'text-primary-400' : 'text-primary-600'
                      } hover:underline`}
                    >
                      {showMoreBrands ? 'Show less' : `Show ${filteredBrands.length - 5} more`}
                      {showMoreBrands ? (
                        <HiOutlineChevronUp className="ml-1 w-4 h-4" />
                      ) : (
                        <HiOutlineChevronDown className="ml-1 w-4 h-4" />
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Colors */}
        {showColors && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('colors')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Colors
              </h4>
              {expandedSections.colors ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.colors && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-4 gap-3"
                >
                  {activeColors.map((color, index) => (
                    <motion.button
                      key={color.name}
                      variants={colorVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleFilterChange('color', color.name)}
                      className="relative group"
                      title={color.name}
                    >
                      <div
                        className={`w-8 h-8 rounded-full mx-auto transition-all ${
                          localFilters.colors?.includes(color.name)
                            ? 'ring-2 ring-primary-500 ring-offset-2'
                            : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                      <span className={`text-xs mt-1 block text-center ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {color.name}
                      </span>
                      {color.count && (
                        <span className={`absolute -top-1 -right-1 text-xs px-1 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {color.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sizes */}
        {showSizes && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('sizes')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Sizes
              </h4>
              {expandedSections.sizes ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.sizes && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex flex-wrap gap-2"
                >
                  {activeSizes.map((size) => (
                    <motion.button
                      key={size.name}
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFilterChange('size', size.name)}
                      className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        localFilters.sizes?.includes(size.name)
                          ? darkMode
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-primary-600 border-primary-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {size.name}
                      {size.count && (
                        <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full ${
                          darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {size.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Rating */}
        {showRating && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <button
              onClick={() => toggleSection('rating')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Minimum Rating
              </h4>
              {expandedSections.rating ? (
                <HiOutlineChevronUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <HiOutlineChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.rating && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <motion.button
                      key={rating}
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onClick={() => handleFilterChange('rating', rating)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        localFilters.minRating === rating
                          ? darkMode
                            ? 'bg-primary-600 bg-opacity-20 text-primary-400'
                            : 'bg-primary-50 text-primary-600'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <HiOutlineStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating
                                ? 'text-yellow-400 fill-current'
                                : darkMode ? 'text-gray-600' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">& Up</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        150+
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Additional Filters */}
        <div className="space-y-3">
          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
            Availability
          </h4>
          <motion.button
            variants={filterItemVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onClick={() => handleFilterChange('inStock', !localFilters.inStock)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              localFilters.inStock
                ? darkMode
                  ? 'bg-primary-600 bg-opacity-20 text-primary-400'
                  : 'bg-primary-50 text-primary-600'
                : darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <span className="text-sm">In Stock Only</span>
            {localFilters.inStock && (
              <HiOutlineCheck className="w-4 h-4" />
            )}
          </motion.button>

          <motion.button
            variants={filterItemVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onClick={() => handleFilterChange('onSale', !localFilters.onSale)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              localFilters.onSale
                ? darkMode
                  ? 'bg-primary-600 bg-opacity-20 text-primary-400'
                  : 'bg-primary-50 text-primary-600'
                : darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <span className="text-sm">On Sale</span>
            {localFilters.onSale && (
              <HiOutlineCheck className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      {showApplyButton && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyFilters}
            className="w-full btn-primary py-3"
          >
            Apply Filters
          </motion.button>
        </div>
      )}
    </div>
  );
};

// Skeleton Loader
export const ProductFiltersSkeleton = () => (
  <div className="bg-white p-4 rounded-lg space-y-6">
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-1">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-8 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ProductFilters;