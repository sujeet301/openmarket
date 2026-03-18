import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
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
  HiOutlineTag,
  HiOutlineRefresh,
  HiOutlineScale,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineCheck
} from 'react-icons/hi';
import { BsLightningCharge } from 'react-icons/bs';

const ProductGrid = ({
  products = [],
  loading = false,
  viewMode = 'grid',
  columns = {
    default: 4,
    lg: 3,
    md: 2,
    sm: 2,
    xs: 1
  },
  showQuickView = true,
  showAddToCart = true,
  showWishlist = true,
  showCompare = true,
  showRating = true,
  showBadges = true,
  showStock = true,
  showActions = true,
  onProductClick,
  onQuickView,
  onAddToCart,
  onWishlistToggle,
  onCompareToggle,
  emptyMessage = "No products found",
  loadingMessage = "Loading products...",
  gridGap = 6,
  cardSize = 'default',
  animate = true,
  lazyLoad = true
}) => {
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [compareList, setCompareList] = useState([]);

  // Handle add to cart
  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.quantity === 0) {
      showNotification('error', 'Product is out of stock');
      return;
    }

    addToCart(product, 1);
    showNotification('success', `${product.name} added to cart`);
    
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showNotification('info', 'Please login to add items to wishlist');
      return;
    }

    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      showNotification('success', `${product.name} removed from wishlist`);
    } else {
      addToWishlist(product);
      showNotification('success', `${product.name} added to wishlist`);
    }

    if (onWishlistToggle) {
      onWishlistToggle(product, !isInWishlist(product._id));
    }
  };

  // Handle compare toggle
  const handleCompareToggle = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    const isInCompare = compareList.some(item => item._id === product._id);
    
    if (isInCompare) {
      setCompareList(compareList.filter(item => item._id !== product._id));
      showNotification('info', `${product.name} removed from comparison`);
    } else {
      if (compareList.length >= 4) {
        showNotification('warning', 'You can compare up to 4 products at a time');
        return;
      }
      setCompareList([...compareList, product]);
      showNotification('success', `${product.name} added to comparison`);
    }

    if (onCompareToggle) {
      onCompareToggle(product, !isInCompare);
    }
  };

  // Handle quick view
  const handleQuickView = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    
    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Handle image load
  const handleImageLoad = (productId) => {
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

  // Get product badge
  const getProductBadge = (product) => {
    const badges = [];
    
    if (product.isNew) {
      badges.push({ text: 'New', color: 'bg-green-500', icon: HiOutlineSparkles });
    }
    if (product.isFeatured) {
      badges.push({ text: 'Featured', color: 'bg-purple-500', icon: HiOutlineFire });
    }
    if (product.discount > 0) {
      badges.push({ text: `${product.discount}% OFF`, color: 'bg-red-500', icon: HiOutlineTag });
    }
    if (product.isBestSeller) {
      badges.push({ text: 'Bestseller', color: 'bg-yellow-500', icon: BsLightningCharge });
    }
    if (product.quantity < 5 && product.quantity > 0) {
      badges.push({ text: 'Low Stock', color: 'bg-orange-500', icon: HiOutlineClock });
    }
    
    return badges;
  };

  // Render stars
  const renderStars = (rating = 0) => {
    return [...Array(5)].map((_, index) => (
      <span key={index}>
        {index < Math.floor(rating) ? (
          <HiStar className="w-4 h-4 text-yellow-400 fill-current" />
        ) : index < rating ? (
          <HiStar className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        ) : (
          <HiOutlineStar className="w-4 h-4 text-gray-300" />
        )}
      </span>
    ));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animate ? 0.05 : 0
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

  const imageVariants = {
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
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

  const actionButtonVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.1, rotate: 5 },
    tap: { scale: 0.9 }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
          <HiOutlineRefresh className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid grid-cols-${columns.xs} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.default} gap-${gridGap}`}
        >
          {products.map((product) => {
            const badges = getProductBadge(product);
            const isWishlisted = isInWishlist(product._id);
            const isInCompare = compareList.some(item => item._id === product._id);
            
            return (
              <motion.div
                key={product._id}
                variants={itemVariants}
                whileHover="hover"
                onHoverStart={() => setHoveredProduct(product._id)}
                onHoverEnd={() => setHoveredProduct(null)}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <Link
                  to={`/product/${product._id}`}
                  onClick={(e) => onProductClick && onProductClick(product, e)}
                  className="block"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {!imageLoaded[product._id] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                      </div>
                    )}
                    
                    <motion.img
                      variants={imageVariants}
                      src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageLoaded[product._id] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => handleImageLoad(product._id)}
                      loading={lazyLoad ? 'lazy' : 'eager'}
                    />

                    {/* Badges */}
                    {showBadges && badges.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {badges.map((badge, index) => (
                          <motion.div
                            key={index}
                            variants={badgeVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            className={`${badge.color} text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg`}
                          >
                            <badge.icon className="w-3 h-3 mr-1" />
                            {badge.text}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Stock Status */}
                    {showStock && product.quantity === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Quick Actions Overlay */}
                    <AnimatePresence>
                      {hoveredProduct === product._id && showActions && product.quantity > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/50 to-transparent"
                        >
                          <div className="flex justify-center gap-2">
                            {showQuickView && (
                              <motion.button
                                variants={actionButtonVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => handleQuickView(product, e)}
                                className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                title="Quick View"
                              >
                                <HiOutlineEye className="w-5 h-5" />
                              </motion.button>
                            )}

                            {showCompare && (
                              <motion.button
                                variants={actionButtonVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => handleCompareToggle(product, e)}
                                className={`p-2 rounded-full transition-colors shadow-lg ${
                                  isInCompare
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-white hover:bg-gray-100'
                                }`}
                                title={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
                              >
                                <HiOutlineScale className="w-5 h-5" />
                              </motion.button>
                            )}

                            {showWishlist && (
                              <motion.button
                                variants={actionButtonVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => handleWishlistToggle(product, e)}
                                className={`p-2 rounded-full transition-colors shadow-lg ${
                                  isWishlisted
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white hover:bg-gray-100'
                                }`}
                                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                              >
                                {isWishlisted ? (
                                  <HiHeart className="w-5 h-5" />
                                ) : (
                                  <HiOutlineHeart className="w-5 h-5" />
                                )}
                              </motion.button>
                            )}

                            {showAddToCart && (
                              <motion.button
                                variants={actionButtonVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => handleAddToCart(product, e)}
                                className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors shadow-lg"
                                title="Add to Cart"
                              >
                                <HiOutlineShoppingBag className="w-5 h-5" />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category */}
                    <p className="text-xs text-gray-500 mb-1">
                      {product.category?.name || 'Uncategorized'}
                    </p>

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-800 hover:text-primary-600 transition-colors duration-300 line-clamp-2 min-h-[3rem] mb-2">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {showRating && (
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({product.numReviews || 0})
                        </span>
                      </div>
                    )}

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

                      {/* Stock Indicator */}
                      {showStock && product.quantity > 0 && product.quantity < 10 && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          Only {product.quantity} left
                        </span>
                      )}
                    </div>

                    {/* Free Shipping Badge */}
                    {product.freeShipping && (
                      <div className="mt-2 flex items-center text-xs text-green-600">
                        <HiOutlineTruck className="w-3 h-3 mr-1" />
                        Free Shipping
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Compare Bar */}
        <AnimatePresence>
          {compareList.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50"
            >
              <div className="container-custom">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      Compare Products ({compareList.length}/4)
                    </span>
                    <div className="flex gap-2">
                      {compareList.map(product => (
                        <div
                          key={product._id}
                          className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-primary-600"
                        >
                          <img
                            src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleCompareToggle(product, new Event('click'))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <HiOutlineX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    to={`/compare?ids=${compareList.map(p => p._id).join(',')}`}
                    className={`btn-primary ${compareList.length < 2 ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    Compare Now
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setQuickViewProduct(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <HiOutlineX className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Images */}
                    <div>
                      <img
                        src={quickViewProduct.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={quickViewProduct.name}
                        className="w-full rounded-lg"
                      />
                      {quickViewProduct.images?.length > 1 && (
                        <div className="grid grid-cols-4 gap-2 mt-4">
                          {quickViewProduct.images.slice(1, 5).map((img, index) => (
                            <img
                              key={index}
                              src={img.url}
                              alt={`${quickViewProduct.name} ${index + 2}`}
                              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{quickViewProduct.name}</h3>
                      <p className="text-gray-600 mb-4">{quickViewProduct.description}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center mb-4">
                        <div className="flex mr-2">
                          {renderStars(quickViewProduct.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({quickViewProduct.numReviews || 0} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {quickViewProduct.compareAtPrice ? (
                          <>
                            <span className="text-3xl font-bold text-primary-600">
                              ${quickViewProduct.price}
                            </span>
                            <span className="ml-2 text-lg text-gray-400 line-through">
                              ${quickViewProduct.compareAtPrice}
                            </span>
                            <span className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                              Save ${(quickViewProduct.compareAtPrice - quickViewProduct.price).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-bold text-primary-600">
                            ${quickViewProduct.price}
                          </span>
                        )}
                      </div>

                      {/* Availability */}
                      <div className="mb-4">
                        {quickViewProduct.quantity > 0 ? (
                          <span className="text-green-600 flex items-center">
                            <HiOutlineCheck className="w-5 h-5 mr-1" />
                            In Stock ({quickViewProduct.quantity} available)
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <HiOutlineX className="w-5 h-5 mr-1" />
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            handleAddToCart(quickViewProduct, new Event('click'));
                            setQuickViewProduct(null);
                          }}
                          disabled={quickViewProduct.quantity === 0}
                          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add to Cart
                        </button>
                        <Link
                          to={`/product/${quickViewProduct._id}`}
                          className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>

                      {/* Features */}
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <HiOutlineShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                          Secure Payment
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <HiOutlineTruck className="w-4 h-4 mr-2 text-blue-600" />
                          Free Shipping on orders over $50
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <HiOutlineRefresh className="w-4 h-4 mr-2 text-purple-600" />
                          30-Day Returns
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {products.map((product) => {
          const badges = getProductBadge(product);
          const isWishlisted = isInWishlist(product._id);
          const isInCompare = compareList.some(item => item._id === product._id);
          
          return (
            <motion.div
              key={product._id}
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link
                to={`/product/${product._id}`}
                onClick={(e) => onProductClick && onProductClick(product, e)}
                className="block"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="md:w-48 h-48 relative bg-gray-100">
                    <img
                      src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges */}
                    {showBadges && badges.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {badges.slice(0, 2).map((badge, index) => (
                          <div
                            key={index}
                            className={`${badge.color} text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center`}
                          >
                            <badge.icon className="w-3 h-3 mr-1" />
                            {badge.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {product.category?.name || 'Uncategorized'}
                        </p>
                        <h3 className="text-xl font-semibold text-gray-800 hover:text-primary-600">
                          {product.name}
                        </h3>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        {showWishlist && (
                          <button
                            onClick={(e) => handleWishlistToggle(product, e)}
                            className={`p-2 rounded-full transition-colors ${
                              isWishlisted
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isWishlisted ? (
                              <HiHeart className="w-5 h-5" />
                            ) : (
                              <HiOutlineHeart className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        
                        {showCompare && (
                          <button
                            onClick={(e) => handleCompareToggle(product, e)}
                            className={`p-2 rounded-full transition-colors ${
                              isInCompare
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <HiOutlineScale className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    {showRating && (
                      <div className="flex items-center mb-3">
                        <div className="flex mr-2">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({product.numReviews || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description || product.shortDescription}
                    </p>

                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <div>
                        {product.compareAtPrice ? (
                          <>
                            <span className="text-2xl font-bold text-primary-600">
                              ${product.price}
                            </span>
                            <span className="ml-2 text-sm text-gray-400 line-through">
                              ${product.compareAtPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-primary-600">
                            ${product.price}
                          </span>
                        )}
                      </div>

                      {showAddToCart && product.quantity > 0 && (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="btn-primary flex items-center"
                        >
                          <HiOutlineShoppingBag className="w-5 h-5 mr-2" />
                          Add to Cart
                        </button>
                      )}
                    </div>

                    {/* Stock Status */}
                    {showStock && product.quantity > 0 && product.quantity < 5 && (
                      <p className="mt-2 text-sm text-orange-600">
                        Only {product.quantity} left in stock
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // Compact view
  if (viewMode === 'compact') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        {products.map((product) => (
          <motion.div
            key={product._id}
            variants={itemVariants}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Link
              to={`/product/${product._id}`}
              onClick={(e) => onProductClick && onProductClick(product, e)}
              className="block"
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-800 truncate">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-primary-600 mt-1">
                  ${product.price}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return null;
};

export default ProductGrid;