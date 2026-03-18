import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  // Heart icons
  HiOutlineHeart,
  HiHeart,
  
  // Shopping icons
  HiOutlineShoppingBag,
  HiOutlineShare,
  HiOutlineScale,
  
  // Star icons
  HiStar,
  HiOutlineStar,
  
  // Shipping & Delivery
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineClock,
  
  // Action icons
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineZoomIn,
  
  // Tag & Badge icons
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineGift,
  
  // Payment icons
  HiOutlineCreditCard,
  HiOutlineCash,
  
  // Contact icons
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineChat,
  
  // Link icon
  HiOutlineLink,
  
  // Location icon - CORRECT ONE
  HiOutlineLocationMarker  // ✅ This is the correct export, not HiOutlineMapPin
} from 'react-icons/hi';
import { 
  FaFacebook, 
  FaTwitter, 
  FaWhatsapp, 
  FaTelegram, 
  FaPinterest, 
  FaReddit,
  FaEnvelope 
} from 'react-icons/fa';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductGrid from '../components/products/ProductGrid';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
      
      // Set default variant if available
      if (response.data.data.variants?.length > 0) {
        setSelectedVariant(response.data.data.variants[0]);
      }

      // Fetch related products
      if (response.data.data.category) {
        const relatedResponse = await api.get(`/products/related/${id}`);
        setRelatedProducts(relatedResponse.data.data);
      }

      // Fetch reviews
      const reviewsResponse = await api.get(`/reviews/product/${id}`);
      setReviews(reviewsResponse.data.data);
      setReviewStats(reviewsResponse.data.ratingSummary);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      showNotification('error', 'Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.quantity === 0) {
      showNotification('error', 'Product is out of stock');
      return;
    }

    const cartItem = {
      ...product,
      selectedVariant,
      quantity
    };

    addToCart(cartItem, quantity);
    showNotification('success', `${product.name} added to cart`);
  };

  const handleWishlistToggle = () => {
    if (!user) {
      showNotification('info', 'Please login to add items to wishlist');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    const isInWishlist = wishlist.some(item => item._id === product._id);
    
    if (isInWishlist) {
      removeFromWishlist(product._id);
      showNotification('success', `${product.name} removed from wishlist`);
    } else {
      addToWishlist(product);
      showNotification('success', `${product.name} added to wishlist`);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on OpenMarket!`;
    
    let shareUrl = '';
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        showNotification('success', 'Link copied to clipboard!');
        setShowShareModal(false);
        return;
    }
    
    window.open(shareUrl, '_blank');
    setShowShareModal(false);
  };

  const checkDelivery = () => {
    // Simulate delivery check
    if (pinCode.length === 6) {
      const available = ['400001', '400002', '400003'].includes(pinCode);
      setDeliveryAvailable(available);
    } else {
      setDeliveryAvailable(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/reviews`, {
        productId: product._id,
        ...newReview
      });
      showNotification('success', 'Review submitted successfully!');
      setNewReview({ rating: 5, title: '', comment: '' });
      fetchProduct(); // Refresh reviews
    } catch (error) {
      showNotification('error', 'Failed to submit review');
    }
  };

  const renderStars = (rating, interactive = false, onClick = null) => {
    return [...Array(5)].map((_, index) => (
      <button
        key={index}
        onClick={() => interactive && onClick?.(index + 1)}
        className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        type="button"
      >
        {index < rating ? (
          <HiStar className="w-5 h-5 text-yellow-400 fill-current" />
        ) : (
          <HiOutlineStar className="w-5 h-5 text-yellow-400" />
        )}
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlist.some(item => item._id === product._id);
  const inStock = product.quantity > 0;
  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary-600">Shop</Link>
          <span className="mx-2">/</span>
          <Link to={`/category/${product.category?.slug}`} className="hover:text-primary-600">
            {product.category?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 group">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={product.images?.[selectedImage]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Zoom Button */}
                <button
                  onClick={() => setShowZoomModal(true)}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HiOutlineZoomIn className="w-5 h-5" />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <HiOutlineSparkles className="mr-1" />
                      New
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <HiOutlineFire className="mr-1" />
                      Featured
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <HiOutlineTag className="mr-1" />
                      {discount}% OFF
                    </span>
                  )}
                </div>

                {/* Out of Stock Overlay */}
                {!inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images?.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary-600 scale-105'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {/* Brand and Category */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  {product.brand && (
                    <span className="text-sm text-gray-500">Brand: </span>
                  )}
                  <span className="text-sm font-medium text-gray-800">{product.brand?.name}</span>
                </div>
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex mr-3">
                  {renderStars(product.rating || 0)}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.numReviews || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                {product.compareAtPrice ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary-600">
                      ${product.price}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.compareAtPrice}
                    </span>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-primary-600">
                    ${product.price}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-gray-600 mb-6">
                {product.shortDescription || product.description?.substring(0, 200)}...
              </p>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Available Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 border-2 rounded-lg transition-all ${
                          selectedVariant === variant
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.quantity}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {product.quantity} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineShoppingBag className="inline mr-2" />
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isInWishlist
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-300 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  {isInWishlist ? (
                    <HiHeart className="w-5 h-5" />
                  ) : (
                    <HiOutlineHeart className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-3 rounded-lg border-2 border-gray-300 hover:border-primary-600 hover:text-primary-600 transition-colors"
                >
                  <HiOutlineShare className="w-5 h-5" />
                </button>
              </div>

              {/* Delivery Check */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <HiOutlineTruck className="mr-2 text-primary-600" />
                  Check Delivery
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Enter PIN code"
                    maxLength="6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={checkDelivery}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Check
                  </button>
                </div>
                {deliveryAvailable !== null && (
                  <div className={`mt-2 text-sm flex items-center ${
                    deliveryAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {deliveryAvailable ? (
                      <>
                        <HiOutlineCheck className="mr-1" />
                        Delivery available to your location
                      </>
                    ) : (
                      <>
                        <HiOutlineX className="mr-1" />
                        Delivery not available to your location
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Product Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineShieldCheck className="mr-2 text-green-600" />
                  Secure Payment
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineRefresh className="mr-2 text-blue-600" />
                  30-Day Returns
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineTruck className="mr-2 text-purple-600" />
                  Free Shipping
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HiOutlineClock className="mr-2 text-orange-600" />
                  1-Year Warranty
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {['description', 'specifications', 'reviews', 'shipping'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 font-medium capitalize transition-all relative ${
                    activeTab === tab
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="prose max-w-none"
              >
                <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div
                key="specifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.attributes?.map((attr, index) => (
                    <div key={index} className="border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-500">{attr.name}:</span>
                      <span className="ml-2 text-sm font-medium text-gray-800">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Review Stats */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                      <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                      
                      <div className="text-center mb-6">
                        <span className="text-5xl font-bold text-gray-800">
                          {reviewStats?.averageRating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-500 text-lg">/5</span>
                        <div className="flex justify-center mt-2">
                          {renderStars(reviewStats?.averageRating || 0)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Based on {reviewStats?.totalReviews || 0} reviews
                        </p>
                      </div>

                      {/* Rating Distribution */}
                      <div className="space-y-2 mb-6">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviewStats?.ratingDistribution?.[rating] || 0;
                          const percentage = reviewStats?.totalReviews 
                            ? (count / reviewStats.totalReviews) * 100 
                            : 0;
                          
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm w-12">{rating} stars</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Write Review Button */}
                      {user && (
                        <button
                          onClick={() => document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' })}
                          className="w-full btn-primary"
                        >
                          Write a Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="lg:col-span-2">
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review._id} className="border-b border-gray-200 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <img
                                  src={review.user?.profilePicture || '/default-avatar.png'}
                                  alt={review.user?.name}
                                  className="w-10 h-10 rounded-full object-cover mr-3"
                                />
                                <div>
                                  <h4 className="font-medium text-gray-800">{review.user?.name}</h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            {review.title && (
                              <h5 className="font-medium text-gray-800 mb-1">{review.title}</h5>
                            )}
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No reviews yet</p>
                    )}

                    {/* Review Form */}
                    {user && (
                      <form id="review-form" onSubmit={handleReviewSubmit} className="mt-8">
                        <h4 className="font-semibold text-gray-800 mb-4">Write a Review</h4>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                          </label>
                          <div className="flex">
                            {renderStars(newReview.rating, true, (rating) => 
                              setNewReview({ ...newReview, rating })
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Title
                          </label>
                          <input
                            type="text"
                            value={newReview.title}
                            onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Summarize your experience"
                            required
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review
                          </label>
                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Share your experience with this product"
                            required
                          />
                        </div>

                        <button type="submit" className="btn-primary">
                          Submit Review
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <HiOutlineTruck className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">Standard Shipping</h4>
                      <p className="text-sm text-gray-600">5-7 business days • $5.00</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <HiOutlineTruck className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">Express Shipping</h4>
                      <p className="text-sm text-gray-600">2-3 business days • $15.00</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <HiOutlineTruck className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">Overnight Shipping</h4>
                      <p className="text-sm text-gray-600">Next business day • $25.00</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Free Shipping</h4>
                    <p className="text-sm text-blue-600">
                      Free standard shipping on orders over $50
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
            <ProductGrid products={relatedProducts} viewMode="grid" />
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Share this Product</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaFacebook className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
                >
                  <FaTwitter className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <FaWhatsapp className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('telegram')}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <FaTelegram className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('pinterest')}
                  className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <FaPinterest className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('reddit')}
                  className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <FaReddit className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <FaEnvelope className="w-6 h-6 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <HiOutlineLink className="w-6 h-6 mx-auto" />
                </button>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {showZoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
            onClick={() => setShowZoomModal(false)}
          >
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <HiOutlineX className="w-8 h-8" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative max-w-4xl w-full h-full flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={product.images?.[selectedImage]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              
              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length)}
                    className="absolute left-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <HiOutlineChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => (prev + 1) % product.images.length)}
                    className="absolute right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <HiOutlineChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductPage;