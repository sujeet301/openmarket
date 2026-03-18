import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  HiOutlineShoppingBag,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineHeart,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineGift,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineSparkles
} from 'react-icons/hi';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  // Calculate totals
  const subtotal = getCartTotal();
  const shipping = shippingMethod === 'express' ? 15 : shippingMethod === 'overnight' ? 25 : 5;
  const tax = subtotal * 0.1; // 10% tax
  const discount = appliedCoupon ? subtotal * 0.1 : 0; // 10% discount if coupon applied
  const total = subtotal + shipping + tax - discount;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId);
    showNotification('success', `${productName} removed from cart`);
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'SAVE10') {
      setAppliedCoupon({ code: 'SAVE10', discount: 10 });
      showNotification('success', 'Coupon applied successfully!');
    } else {
      showNotification('error', 'Invalid coupon code');
    }
    setCouponCode('');
  };

  const handleSaveForLater = (item) => {
    setSavedItems([...savedItems, item]);
    removeFromCart(item.product._id);
    showNotification('success', `${item.product.name} saved for later`);
  };

  const handleMoveToCart = (item) => {
    // Add back to cart
    updateQuantity(item.product._id, item.quantity);
    setSavedItems(savedItems.filter(i => i.product._id !== item.product._id));
    showNotification('success', `${item.product.name} moved to cart`);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      showNotification('info', 'Please login to checkout');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    setIsCheckingOut(true);
    // Simulate checkout process
    setTimeout(() => {
      setIsCheckingOut(false);
      showNotification('success', 'Order placed successfully!');
      clearCart();
      navigate('/orders');
    }, 2000);
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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.3
      }
    }
  };

  const emptyCartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Empty cart state
  if (cart.length === 0 && savedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <motion.div
            variants={emptyCartVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="inline-block"
              >
                <HiOutlineShoppingBag className="w-24 h-24 text-gray-300 mx-auto" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-8 w-8 flex items-center justify-center"
              >
                0
              </motion.div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            
            <div className="space-y-3">
              <Link
                to="/shop"
                className="block w-full btn-primary"
              >
                Start Shopping
              </Link>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <HiOutlineTruck className="w-5 h-5 mx-auto text-primary-600 mb-1" />
                  <p className="text-xs text-gray-500">Free Shipping</p>
                </div>
                <div className="text-center">
                  <HiOutlineShieldCheck className="w-5 h-5 mx-auto text-primary-600 mb-1" />
                  <p className="text-xs text-gray-500">Secure Payment</p>
                </div>
                <div className="text-center">
                  <HiOutlineRefresh className="w-5 h-5 mx-auto text-primary-600 mb-1" />
                  <p className="text-xs text-gray-500">Easy Returns</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
          <Link
            to="/shop"
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <HiOutlineArrowLeft className="mr-2" />
            Continue Shopping
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Cart Items ({getCartCount()})
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.product._id}
                      variants={itemVariants}
                      exit="exit"
                      className="p-6"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/product/${item.product._id}`}
                          className="sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <Link
                              to={`/product/${item.product._id}`}
                              className="text-lg font-semibold text-gray-800 hover:text-primary-600"
                            >
                              {item.product.name}
                            </Link>
                            <button
                              onClick={() => handleRemoveItem(item.product._id, item.product.name)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>

                          <p className="text-sm text-gray-500 mb-2">
                            {item.product.category?.name || 'Uncategorized'}
                          </p>

                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-primary-600">
                                ${item.product.price}
                              </span>
                              {item.product.compareAtPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                  ${item.product.compareAtPrice}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <HiOutlineMinus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                disabled={item.quantity >= (item.product.quantity || 99)}
                              >
                                <HiOutlinePlus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleSaveForLater(item)}
                              className="text-sm text-gray-500 hover:text-primary-600 flex items-center"
                            >
                              <HiOutlineHeart className="mr-1" />
                              Save for later
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                              Item Total: <span className="text-primary-600 font-bold">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Saved for Later */}
            {savedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Saved for Later ({savedItems.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {savedItems.map((item) => (
                    <div key={item.product._id} className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">${item.product.price}</p>
                        </div>
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Move to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Order Summary
              </h2>

              {/* Coupon Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <HiOutlineCheck className="mr-1" />
                    Coupon {appliedCoupon.code} applied ({appliedCoupon.discount}% off)
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Method
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="standard">Standard Shipping ($5) - 5-7 days</option>
                  <option value="express">Express Shipping ($15) - 2-3 days</option>
                  <option value="overnight">Overnight Shipping ($25) - Next day</option>
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full btn-primary py-3 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>

              {/* Payment Methods */}
              <div className="flex items-center justify-center space-x-2">
                <HiOutlineCreditCard className="w-5 h-5 text-gray-400" />
                <HiOutlineCash className="w-5 h-5 text-gray-400" />
                <HiOutlineGift className="w-5 h-5 text-gray-400" />
                <HiOutlineSparkles className="w-5 h-5 text-gray-400" />
              </div>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                  <div>
                    <HiOutlineTruck className="w-4 h-4 mx-auto mb-1" />
                    Free Shipping
                  </div>
                  <div>
                    <HiOutlineShieldCheck className="w-4 h-4 mx-auto mb-1" />
                    Secure Payment
                  </div>
                  <div>
                    <HiOutlineRefresh className="w-4 h-4 mx-auto mb-1" />
                    30-Day Returns
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;