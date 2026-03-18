import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiStar,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineViewBoards,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineShare,
  HiOutlineScale,
  HiOutlineLightningBolt
} from 'react-icons/hi';

const FeaturedProducts = ({
  products = [],
  title = "Featured Products",
  subtitle = "Discover our most popular and trending items",
  viewMode: initialViewMode = "grid",
  showFilters = true,
  showViewToggle = true,
  itemsPerPage = 8,
  autoplay = false,
  autoplaySpeed = 5000
}) => {
  const { addToCart } = useCart();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // State management
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [comparingProducts, setComparingProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplay);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category?.name || 'Uncategorized'))];
    return cats;
  }, [products]);

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category?.name === selectedCategory);
    }

    // Apply price filter
    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        result.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
        break;
      default:
        // featured - keep original order
        break;
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, selectedCategory, priceRange, sortBy]);

  // Autoplay for slider mode
  useEffect(() => {
    let interval;
    if (isAutoPlaying && viewMode === 'slider') {
      interval = setInterval(() => {
        setCurrentSlide(prev => 
          prev >= Math.ceil(filteredProducts.length / 4) - 1 ? 0 : prev + 1
        );
      }, autoplaySpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredProducts.length, viewMode, autoplaySpeed]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Wishlist handlers
  const toggleWishlist = (product) => {
    if (!user) {
      showNotification('info', 'Please login to add items to wishlist');
      return;
    }
    
    if (wishlist.includes(product._id)) {
      setWishlist(wishlist.filter(id => id !== product._id));
      showNotification('success', `${product.name} removed from wishlist`);
    } else {
      setWishlist([...wishlist, product._id]);
      showNotification('success', `${product.name} added to wishlist`);
    }
  };

  // Compare handlers
  const toggleCompare = (product) => {
    if (comparingProducts.includes(product._id)) {
      setComparingProducts(comparingProducts.filter(id => id !== product._id));
      showNotification('info', `${product.name} removed from comparison`);
    } else {
      if (comparingProducts.length >= 4) {
        showNotification('warning', 'You can compare up to 4 products at a time');
        return;
      }
      setComparingProducts([...comparingProducts, product._id]);
      showNotification('success', `${product.name} added to comparison`);
    }
  };

  // Add to cart handler
  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  // Quick view handler
  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  // Render stars for rating
  const renderStars = (rating = 0) => {
    return [...Array(5)].map((_, index) => (
      index < Math.floor(rating) ? (
        <HiStar key={index} className="w-4 h-4 text-yellow-400 fill-current" />
      ) : (
        <HiOutlineStar key={index} className="w-4 h-4 text-yellow-400" />
      )
    ));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const badgeVariants = {
    initial: { scale: 0, rotate: -90 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  // Get product badge based on attributes
  const getProductBadge = (product) => {
    if (product.isNew) {
      return { text: 'New', color: 'bg-green-500', icon: HiOutlineSparkles };
    }
    if (product.isFeatured) {
      return { text: 'Featured', color: 'bg-purple-500', icon: HiOutlineFire };
    }
    if (product.discount > 0) {
      return { text: `${product.discount}% OFF`, color: 'bg-red-500', icon: HiOutlineTag };
    }
    if (product.isBestSeller) {
      return { text: 'Bestseller', color: 'bg-yellow-500', icon: HiOutlineLightningBolt };
    }
    return null;
  };

  // Grid view
  const renderGridView = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {paginatedProducts.map((product) => {
        const badge = getProductBadge(product);
        const Icon = badge?.icon || HiOutlineTag;
        
        return (
          <motion.div
            key={product._id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            onHoverStart={() => setHoveredProduct(product._id)}
            onHoverEnd={() => setHoveredProduct(null)}
            className="group relative bg-white rounded-2xl shadow-lg overflow-hidden
              transform transition-all duration-300 hover:shadow-2xl"
          >
            {/* Product Image */}
            <Link to={`/product/${product._id}`} className="block relative aspect-square overflow-hidden">
              <motion.img
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4 }}
                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Badge */}
              {badge && (
                <motion.div
                  variants={badgeVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  className={`absolute top-3 left-3 ${badge.color} text-white 
                    px-2 py-1 rounded-full text-xs font-bold flex items-center`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {badge.text}
                </motion.div>
              )}

              {/* Out of Stock Overlay */}
              {product.quantity === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Quick Actions on Hover */}
              <AnimatePresence>
                {hoveredProduct === product._id && product.quantity > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/50 to-transparent"
                  >
                    <div className="flex justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickView(product)}
                        className="bg-white p-2 rounded-full hover:bg-gray-100"
                        title="Quick View"
                      >
                        <HiOutlineEye className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleCompare(product)}
                        className={`p-2 rounded-full ${
                          comparingProducts.includes(product._id)
                            ? 'bg-primary-600 text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                        title="Compare"
                      >
                        <HiOutlineScale className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleWishlist(product)}
                        className={`p-2 rounded-full ${
                          wishlist.includes(product._id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                        title="Add to Wishlist"
                      >
                        {wishlist.includes(product._id) ? (
                          <HiHeart className="w-5 h-5" />
                        ) : (
                          <HiOutlineHeart className="w-5 h-5" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddToCart(product)}
                        className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                        title="Add to Cart"
                      >
                        <HiOutlineShoppingBag className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link to={`/product/${product._id}`}>
                <h3 className="font-semibold text-gray-800 hover:text-primary-600 
                  transition-colors duration-300 text-lg mb-1 line-clamp-1">
                  {product.name}
                </h3>
              </Link>

              {/* Category */}
              <p className="text-sm text-gray-500 mb-2">
                {product.category?.name || 'Uncategorized'}
              </p>

              {/* Rating */}
              <div className="flex items-center mb-2">
                <div className="flex mr-2">
                  {renderStars(product.rating)}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.numReviews || 0})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  {product.compareAtPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary-600">
                        ${product.price}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ${product.compareAtPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-primary-600">
                      ${product.price}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                {product.quantity > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(product)}
                    className="bg-primary-600 text-white p-2 rounded-lg
                      hover:bg-primary-700 transition-colors"
                  >
                    <HiOutlineShoppingBag className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );

  // List view
  const renderListView = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {paginatedProducts.map((product) => (
        <motion.div
          key={product._id}
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
        >
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <Link to={`/product/${product._id}`} className="md:w-48 h-48 relative overflow-hidden">
              <img
                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* Product Details */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link to={`/product/${product._id}`}>
                    <h3 className="text-xl font-semibold text-gray-800 hover:text-primary-600">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mb-2">{product.category?.name}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleWishlist(product)}
                    className={`p-2 rounded-full ${
                      wishlist.includes(product._id)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {wishlist.includes(product._id) ? (
                      <HiHeart className="w-5 h-5" />
                    ) : (
                      <HiOutlineHeart className="w-5 h-5" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAddToCart(product)}
                    className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                  >
                    <HiOutlineShoppingBag className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-3">
                <div className="flex mr-2">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.numReviews || 0} reviews)
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">
                {product.description || product.shortDescription}
              </p>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary-600">
                  ${product.price}
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ${product.compareAtPrice}
                    </span>
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  // Slider view
  const renderSliderView = () => (
    <div className="relative">
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-6"
          animate={{ x: -currentSlide * (100 / 4) * (100 / filteredProducts.length) }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {filteredProducts.map((product) => (
            <motion.div
              key={product._id}
              className="flex-none w-1/4"
              whileHover={{ scale: 1.02 }}
            >
              {/* Product card similar to grid view but with slider specific styling */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-lg font-bold text-primary-600">${product.price}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Slider Controls */}
      <button
        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
      >
        <HiChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentSlide(Math.min(totalPages - 1, currentSlide + 1))}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
      >
        <HiChevronRight className="w-6 h-6" />
      </button>
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          {/* Filters Button (Mobile) */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="lg:hidden flex items-center px-4 py-2 bg-white rounded-lg shadow"
          >
            <HiOutlineFilter className="mr-2" />
            Filters
          </button>

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-2 bg-white rounded-lg shadow p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <HiOutlineViewGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <HiOutlineViewList className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`p-2 rounded ${viewMode === 'slider' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <HiOutlineViewBoards className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Best Selling</option>
          </select>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFiltersPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Min"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setPriceRange({ min: 0, max: 10000 });
                        setSortBy('featured');
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                    {comparingProducts.length > 0 && (
                      <Link
                        to={`/compare?ids=${comparingProducts.join(',')}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Compare ({comparingProducts.length})
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <HiOutlineRefresh className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'slider' && renderSliderView()}
          </>
        )}

        {/* Pagination */}
        {viewMode !== 'slider' && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white shadow disabled:opacity-50"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white shadow disabled:opacity-50"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-3 bg-primary-600 text-white 
              rounded-lg font-semibold hover:bg-primary-700 transition-all duration-300
              transform hover:scale-105 hover:shadow-xl group"
          >
            View All Products
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-2"
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick view content */}
              <div className="p-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setQuickViewProduct(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <HiOutlineX className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <img
                    src={quickViewProduct.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={quickViewProduct.name}
                    className="w-full rounded-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{quickViewProduct.name}</h3>
                    <p className="text-gray-600 mb-4">{quickViewProduct.description}</p>
                    <p className="text-3xl font-bold text-primary-600 mb-4">
                      ${quickViewProduct.price}
                    </p>
                    <button
                      onClick={() => {
                        handleAddToCart(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      className="w-full btn-primary"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// Skeleton Loader
export const FeaturedProductsSkeleton = () => (
  <section className="py-16 bg-gray-50">
    <div className="container-custom">
      <div className="text-center mb-12">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
        <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedProducts;