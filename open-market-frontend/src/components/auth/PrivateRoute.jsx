import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  HiLockClosed, 
  HiShieldExclamation, 
  HiHome,
  HiArrowLeft,
  HiRefresh
} from 'react-icons/hi';

const PrivateRoute = ({ 
  allowedRoles = [],
  redirectTo = '/login',
  fallbackPath = '/',
  sessionTimeout = 30 * 60 * 1000, // 30 minutes default
  idleTimeout = 15 * 60 * 1000, // 15 minutes idle timeout
}) => {
  const { user, loading, isAuthenticated, logout, refreshToken } = useAuth();
  const { showNotification } = useNotification();
  const location = useLocation();
  
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity for session management
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (showSessionWarning) setShowSessionWarning(false);
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, showSessionWarning]);

  // Check for idle timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const idleInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      
      if (idleTime > idleTimeout && idleTime < sessionTimeout) {
        setShowSessionWarning(true);
        showNotification(
          'warning',
          'You have been idle. Click to stay logged in.',
          10000,
          {
            action: {
              label: 'Stay Logged In',
              onClick: () => setLastActivity(Date.now())
            }
          }
        );
      }
      
      if (idleTime > sessionTimeout) {
        // Session expired due to inactivity
        handleSessionExpired();
      }
    }, 60000); // Check every minute

    return () => clearInterval(idleInterval);
  }, [isAuthenticated, lastActivity, idleTimeout, sessionTimeout]);

  // Session expiry check
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Decode JWT to check expiration
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      if (payload.exp) {
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const timeUntilExpiry = expiryTime - Date.now();
        
        // Show warning 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
          showNotification(
            'warning',
            'Your session will expire soon. Please save your work.',
            30000
          );
        }
        
        // Auto logout on expiry
        if (timeUntilExpiry <= 0) {
          handleSessionExpired();
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, [isAuthenticated]);

  const handleSessionExpired = async () => {
    showNotification('info', 'Your session has expired. Please login again.');
    await logout();
  };

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      showNotification('success', 'Session refreshed successfully');
      setShowSessionWarning(false);
    } catch (error) {
      showNotification('error', 'Failed to refresh session. Please login again.');
      await logout();
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <LoadingSpinner />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-gray-600 font-medium"
          >
            Verifying your credentials...
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-sm text-gray-500"
          >
            Please wait while we secure your session
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
          message: 'Please login to access this page'
        }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Beautiful Access Denied page
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Animated Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block"
            >
              <HiShieldExclamation className="text-white text-7xl mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mt-2">Access Denied</h2>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500">
                This area is restricted to {allowedRoles.join(' or ')} only.
              </p>
              {user && (
                <p className="text-sm text-gray-500 mt-2">
                  Your current role: <span className="font-semibold text-primary-600">{user.role}</span>
                </p>
              )}
            </div>

            {/* Permission Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <HiLockClosed className="mr-2 text-primary-600" />
                Required Permissions:
              </h3>
              <ul className="space-y-2">
                {allowedRoles.map((role, index) => (
                  <motion.li
                    key={role}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      role === 'admin' ? 'bg-purple-500' :
                      role === 'seller' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    {role.charAt(0).toUpperCase() + role.slice(1)} access required
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to={fallbackPath}
                className="block w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <HiHome className="mr-2" />
                  Go to Homepage
                </motion.button>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <HiArrowLeft className="mr-2" />
                Go Back
              </button>
            </div>

            {/* Contact Support */}
            <p className="text-xs text-center text-gray-500 mt-6">
              Need access? Contact your administrator or{' '}
              <Link to="/support" className="text-primary-600 hover:text-primary-700">
                request permissions
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Session Expiry Warning Modal
  return (
    <>
      <AnimatePresence>
        {showSessionWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-yellow-500 p-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <HiRefresh className="mr-2 animate-spin-slow" />
                  Session Expiring Soon
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Your session will expire in less than 5 minutes due to inactivity.
                  Would you like to stay logged in?
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLastActivity(Date.now());
                      setShowSessionWarning(false);
                    }}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700"
                  >
                    Stay Logged In
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSessionExpired}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render the protected route */}
      <Outlet />
    </>
  );
};

// Role-specific route components
export const AdminRoute = (props) => (
  <PrivateRoute {...props} allowedRoles={['admin']} />
);

export const SellerRoute = (props) => (
  <PrivateRoute {...props} allowedRoles={['seller', 'admin']} />
);

export const ClientRoute = (props) => (
  <PrivateRoute {...props} allowedRoles={['client', 'seller', 'admin']} />
);

// Auth guard for specific permissions
export const PermissionRoute = ({ permission, children, ...props }) => {
  const { user } = useAuth();
  
  // Check if user has specific permission
  const hasPermission = user?.permissions?.includes(permission);
  
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

export default PrivateRoute;