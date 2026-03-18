    import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Get redirect message from location state
  const redirectMessage = location.state?.message;
  
  useEffect(() => {
    if (redirectMessage) {
      showNotification('info', redirectMessage);
    }
  }, [redirectMessage, showNotification]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Reset login attempts on success
        setLoginAttempts(0);
        
        // Show success message
        showNotification('success', 'Welcome back! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
          if (user?.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (user?.role === 'seller') {
            navigate('/seller/dashboard');
          } else {
            navigate('/');
          }
        }, 1500);
      } else {
        // Increment login attempts on failure
        setLoginAttempts(prev => prev + 1);
        
        // Show lockout warning after 3 attempts
        if (loginAttempts >= 3) {
          showNotification('warning', 'Too many failed attempts. Please try again later or reset your password.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    showNotification('info', `${provider} login coming soon!`);
    // Implement social login logic here
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const floatingIconsVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Floating Background Elements */}
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        custom={1}
        className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        transition={{ delay: 0.5 }}
      />
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        custom={2}
        className="absolute top-40 right-40 w-24 h-24 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        transition={{ delay: 1 }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
              <span className="text-white text-3xl font-bold">OM</span>
            </div>
          </motion.div>
          
          <motion.h2 
            variants={itemVariants}
            className="mt-6 text-3xl font-extrabold text-gray-900"
          >
            Welcome Back!
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="mt-2 text-sm text-gray-600"
          >
            Please sign in to your account
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form 
          variants={itemVariants}
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
        >
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`
                  block w-full pl-10 pr-3 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-all duration-300
                  ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="you@example.com"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`
                  block w-full pl-10 pr-10 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-all duration-300
                  ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              group relative w-full flex justify-center py-3 px-4
              border border-transparent text-sm font-medium rounded-lg
              text-white bg-primary-600 hover:bg-primary-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              transition-all duration-300
              ${loading ? 'opacity-75 cursor-not-allowed' : ''}
            `}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing in...
              </div>
            ) : (
              <span className="flex items-center">
                Sign in
                <HiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </motion.button>

          {/* Login Attempts Warning */}
          {loginAttempts >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
            >
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Warning:</strong> {3 - loginAttempts} attempts remaining before temporary lockout
              </p>
            </motion.div>
          )}
        </motion.form>

        {/* Social Login */}
        <motion.div variants={itemVariants}>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSocialLogin('Google')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              <span className="text-sm">Google</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSocialLogin('Facebook')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaFacebook className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm">Facebook</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign up now
            </Link>
          </p>
        </motion.div>

        {/* Demo Credentials (for testing) */}
        <motion.div 
          variants={itemVariants}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Admin:</span> admin@openmarket.com / Admin@123456</p>
            <p><span className="font-medium">Seller:</span> seller@openmarket.com / Seller@123456</p>
            <p><span className="font-medium">User:</span> user@openmarket.com / User@123456</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;