import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';
import {
  HiShoppingBag,
  HiExclamationCircle,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiShieldCheck,
  HiDocumentText,
  HiUpload,
  HiCurrencyDollar,
  HiChartBar,
  HiStar,
  HiUserGroup,
  HiRefresh,
  HiArrowRight,
  HiHome,
  HiPhone,
  HiMail,
  HiChat
} from 'react-icons/hi';
import { FaStore, FaRegCreditCard } from 'react-icons/fa';

const SellerRoute = ({
  verificationRequired = true,
  minimumProducts = 0,
  minimumSales = 0,
  minimumRating = 0,
  redirectTo = '/login',
  fallbackPath = '/',
  showOnboarding = true
}) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { showNotification } = useNotification();
  const location = useLocation();
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Fetch seller status and stats
  useEffect(() => {
    if (isAuthenticated && user?.role === 'seller') {
      fetchSellerStatus();
    }
  }, [isAuthenticated, user]);

  const fetchSellerStatus = async () => {
    try {
      const response = await api.get('/seller/status');
      setVerificationStatus(response.data.data.verificationStatus);
      setSellerStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch seller status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/seller/resend-verification');
      showNotification('success', 'Verification email sent successfully');
    } catch (error) {
      showNotification('error', 'Failed to send verification email');
    }
  };

  const handleCompleteProfile = () => {
    setShowVerificationModal(false);
    // Navigate to seller profile completion
    window.location.href = '/seller/complete-profile';
  };

  // Show loading spinner while checking authentication
  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md"
        >
          <div className="relative">
            <LoadingSpinner />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <FaStore className="text-primary-600 text-2xl" />
            </motion.div>
          </div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xl font-semibold text-gray-800"
          >
            Verifying Seller Status
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-sm text-gray-600"
          >
            Please wait while we check your seller credentials
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Please login to access seller dashboard',
          intendedRole: 'seller'
        }} 
        replace 
      />
    );
  }

  // Check if user is seller
  if (user?.role !== 'seller') {
    // Not a seller - show upgrade prompt
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center relative overflow-hidden">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-block"
            >
              <FaStore className="text-white text-7xl mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mt-4">Become a Seller</h2>
            <p className="text-purple-100 mt-2">Start selling on OpenMarket today!</p>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-10 right-10 w-20 h-20 bg-white opacity-10 rounded-full"
            />
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute bottom-10 left-10 w-32 h-32 bg-white opacity-10 rounded-full"
            />
          </div>

          {/* Benefits Grid */}
          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Why become a seller on OpenMarket?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: HiUserGroup, title: 'Reach Millions', desc: 'Access our large customer base' },
                { icon: HiChartBar, title: 'Grow Your Business', desc: 'Analytics and insights to scale' },
                { icon: HiCurrencyDollar, title: 'Competitive Pricing', desc: 'Low commission rates' },
                { icon: HiShieldCheck, title: 'Secure Payments', desc: 'Protected transactions' },
                { icon: HiUpload, title: 'Easy Listing', desc: 'Simple product management' },
                { icon: HiStar, title: 'Build Reputation', desc: 'Customer reviews and ratings' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <benefit.icon className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{benefit.title}</h4>
                    <p className="text-sm text-gray-600">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">50K+</div>
                <div className="text-xs text-gray-600">Active Sellers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">1M+</div>
                <div className="text-xs text-gray-600">Products Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">₹10Cr+</div>
                <div className="text-xs text-gray-600">Seller Earnings</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/seller/register"
                className="block w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-lg"
                >
                  Register as Seller
                  <HiArrowRight className="ml-2" />
                </motion.button>
              </Link>
              
              <Link to="/" className="block w-full">
                <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Browse as Customer
                </button>
              </Link>
            </div>

            {/* Contact Support */}
            <p className="text-xs text-center text-gray-500 mt-6">
              Have questions?{' '}
              <button 
                onClick={() => showNotification('info', 'Seller support team will contact you soon')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Contact seller support
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Check verification status
  if (verificationRequired && verificationStatus !== 'verified') {
    const verificationMessages = {
      'pending': {
        title: 'Verification Pending',
        message: 'Your seller account is under review. This usually takes 24-48 hours.',
        icon: HiClock,
        color: 'yellow',
        action: 'Track Status'
      },
      'rejected': {
        title: 'Verification Failed',
        message: 'Your seller verification was rejected. Please update your documents.',
        icon: HiXCircle,
        color: 'red',
        action: 'Resubmit Documents'
      },
      'incomplete': {
        title: 'Complete Your Profile',
        message: 'Please complete your seller profile to start selling.',
        icon: HiDocumentText,
        color: 'blue',
        action: 'Complete Profile'
      }
    };

    const status = verificationStatus || 'incomplete';
    const msg = verificationMessages[status] || verificationMessages.incomplete;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className={`bg-${msg.color}-500 p-6 text-center`}>
            <msg.icon className="text-white text-6xl mx-auto" />
            <h2 className="text-2xl font-bold text-white mt-2">{msg.title}</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">{msg.message}</p>

            {verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Verification Progress</span>
                  <span className="text-sm font-medium text-yellow-800">60%</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-yellow-600 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Step 3 of 5: Document verification in progress
                </p>
              </div>
            )}

            {verificationStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Rejection Reasons:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  <li>Invalid business registration document</li>
                  <li>Address proof doesn't match records</li>
                  <li>Please upload clear images of documents</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleCompleteProfile}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {msg.action}
              </button>
              
              {verificationStatus === 'pending' && (
                <button
                  onClick={handleResendVerification}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Resend Verification Email
                </button>
              )}

              <Link to="/seller/help" className="block text-center text-sm text-primary-600 hover:text-primary-700">
                Need help with verification?
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Check minimum requirements
  if (sellerStats) {
    const requirements = [];
    if (minimumProducts > 0 && sellerStats.totalProducts < minimumProducts) {
      requirements.push(`minimum ${minimumProducts} products`);
    }
    if (minimumSales > 0 && sellerStats.totalSales < minimumSales) {
      requirements.push(`minimum ${minimumSales} sales`);
    }
    if (minimumRating > 0 && sellerStats.averageRating < minimumRating) {
      requirements.push(`minimum rating of ${minimumRating}`);
    }

    if (requirements.length > 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-blue-500 p-6 text-center">
              <HiExclamationCircle className="text-white text-6xl mx-auto" />
              <h2 className="text-2xl font-bold text-white mt-2">Requirements Not Met</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Your seller account doesn't meet the requirements for this section:
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Current Stats:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{sellerStats.totalProducts} / {minimumProducts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-medium">{sellerStats.totalSales} / {minimumSales}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{sellerStats.averageRating.toFixed(1)} / {minimumRating}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to="/seller/dashboard">
                  <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Go to Dashboard
                  </button>
                </Link>
                
                <Link to="/seller/products/new">
                  <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Add More Products
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    }
  }

  // All checks passed - render the protected route with seller context
  return (
    <>
      {/* Seller Context Provider */}
      <SellerContext.Provider value={{ sellerStats, verificationStatus }}>
        <Outlet />
      </SellerContext.Provider>

      {/* Floating Seller Assistant */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => showNotification('info', 'Seller assistant coming soon!')}
          className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
        >
          <HiChat className="text-2xl" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </motion.button>
      </motion.div>

      {/* Seller Stats Bar (optional) */}
      {sellerStats && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 transform translate-y-full"
        >
          <div className="container-custom py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-700">Seller Stats:</span>
                <span className="text-green-600">₹{sellerStats.todayRevenue} today</span>
                <span className="text-blue-600">{sellerStats.pendingOrders} pending</span>
                <span className="text-purple-600">{sellerStats.totalProducts} products</span>
              </div>
              <button className="text-primary-600 hover:text-primary-700">
                View Details
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

// Seller Context for passing seller data to child routes
const SellerContext = React.createContext(null);
export const useSeller = () => React.useContext(SellerContext);

// Specialized seller routes with additional requirements
export const VerifiedSellerRoute = (props) => (
  <SellerRoute {...props} verificationRequired={true} />
);

export const EstablishedSellerRoute = (props) => (
  <SellerRoute 
    {...props} 
    verificationRequired={true}
    minimumProducts={10}
    minimumSales={50}
    minimumRating={4.0}
  />
);

export const PremiumSellerRoute = (props) => (
  <SellerRoute 
    {...props} 
    verificationRequired={true}
    minimumProducts={50}
    minimumSales={500}
    minimumRating={4.5}
  />
);

// Quick stats component for sellers
export const SellerStatsWidget = () => {
  const sellerStats = useSeller();
  
  if (!sellerStats) return null;
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Today's Revenue</p>
          <p className="text-xl font-bold text-green-600">₹{sellerStats.todayRevenue}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-xl font-bold text-blue-600">{sellerStats.pendingOrders}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-xl font-bold text-purple-600">{sellerStats.totalProducts}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg. Rating</p>
          <p className="text-xl font-bold text-yellow-600">{sellerStats.averageRating.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default SellerRoute;