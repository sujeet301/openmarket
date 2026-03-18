import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  HiUser, 
  HiMail, 
  HiLockClosed, 
  HiEye, 
  HiEyeOff,
  HiPhone,
  HiHome,
  HiCalendar,
  HiCheckCircle,
  HiArrowRight,
  HiArrowLeft,
  HiShieldCheck,
  HiIdentification
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import { BsShieldLock, BsShieldCheck } from 'react-icons/bs';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const { showNotification } = useNotification();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Info
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    
    // Step 3: Address
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    
    // Step 4: Preferences
    role: 'client',
    newsletter: true,
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touched, setTouched] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (formData.password.match(/[a-z]/)) strength += 25;
      if (formData.password.match(/[A-Z]/)) strength += 25;
      if (formData.password.match(/[0-9]/)) strength += 15;
      if (formData.password.match(/[^a-zA-Z0-9]/)) strength += 10;
      setPasswordStrength(Math.min(strength, 100));
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.address.street) {
      newErrors['address.street'] = 'Street address is required';
    }
    if (!formData.address.city) {
      newErrors['address.city'] = 'City is required';
    }
    if (!formData.address.state) {
      newErrors['address.state'] = 'State is required';
    }
    if (!formData.address.zipCode) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    } else if (!/^\d{6}$/.test(formData.address.zipCode)) {
      newErrors['address.zipCode'] = 'ZIP code must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (address)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep4()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        role: formData.role,
        newsletter: formData.newsletter
      };
      
      const result = await register(registrationData);
      
      if (result.success) {
        showNotification('success', 'Registration successful! Please check your email to verify your account.');
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.' 
          } 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    showNotification('info', `${provider} registration coming soon!`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const stepVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    },
    exit: {
      x: -50,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const floatingIconsVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  // Step titles
  const steps = [
    { number: 1, title: 'Account', icon: HiUser },
    { number: 2, title: 'Personal', icon: HiIdentification },
    { number: 3, title: 'Address', icon: HiHome },
    { number: 4, title: 'Confirm', icon: HiCheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Floating Background Elements */}
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        className="absolute top-10 left-10 w-40 h-40 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
      />
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        custom={1}
        className="absolute bottom-10 right-10 w-60 h-60 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
        transition={{ delay: 0.5 }}
      />
      <motion.div
        variants={floatingIconsVariants}
        animate="animate"
        custom={2}
        className="absolute top-40 right-40 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
        transition={{ delay: 1 }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            variants={stepVariants}
            className="flex justify-center"
          >
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
              <span className="text-white text-2xl font-bold">OM</span>
            </div>
          </motion.div>
          
          <motion.h2 
            variants={stepVariants}
            className="mt-4 text-3xl font-extrabold text-gray-900"
          >
            Create Account
          </motion.h2>
          
          <motion.p 
            variants={stepVariants}
            className="mt-2 text-sm text-gray-600"
          >
            Join thousands of shoppers on OpenMarket
          </motion.p>
        </div>

        {/* Progress Steps */}
        <motion.div variants={stepVariants} className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${currentStep >= step.number 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <HiCheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className="text-xs mt-2 font-medium text-gray-600">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Account Information
                </h3>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      className={`
                        w-full pl-10 pr-3 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.name && errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="John Doe"
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      className={`
                        w-full pl-10 pr-3 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.email && errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="you@example.com"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      className={`
                        w-full pl-10 pr-10 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.password && errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <HiEyeOff className="text-gray-400" /> : <HiEye className="text-gray-400" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            className={`h-full ${getPasswordStrengthColor()}`}
                          />
                        </div>
                        <span className="ml-2 text-xs font-medium text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1 mt-2">
                        <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                          <HiCheckCircle className={`mr-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                          At least 8 characters
                        </li>
                        <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                          <HiCheckCircle className={`mr-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                          One lowercase letter
                        </li>
                        <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                          <HiCheckCircle className={`mr-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                          One uppercase letter
                        </li>
                        <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                          <HiCheckCircle className={`mr-1 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                          One number
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <BsShieldLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`
                        w-full pl-10 pr-10 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <HiEyeOff className="text-gray-400" /> : <HiEye className="text-gray-400" />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end pt-4">
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center"
                  >
                    Next Step
                    <HiArrowRight className="ml-2" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Personal Information
                </h3>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      onBlur={() => handleBlur('phoneNumber')}
                      className={`
                        w-full pl-10 pr-3 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.phoneNumber && errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="9876543210"
                    />
                  </div>
                  {touched.phoneNumber && errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth (Optional)
                  </label>
                  <div className="relative">
                    <HiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      onBlur={() => handleBlur('dateOfBirth')}
                      className={`
                        w-full pl-10 pr-3 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched.dateOfBirth && errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender (Optional)
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                      className={`
                        p-4 border-2 rounded-lg text-center transition-all duration-300
                        ${formData.role === 'client' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                        }
                      `}
                    >
                      <HiUser className={`mx-auto text-2xl mb-2 ${formData.role === 'client' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${formData.role === 'client' ? 'text-primary-600' : 'text-gray-600'}`}>
                        Shop & Buy
                      </span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
                      className={`
                        p-4 border-2 rounded-lg text-center transition-all duration-300
                        ${formData.role === 'seller' 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                        }
                      `}
                    >
                      <HiHome className={`mx-auto text-2xl mb-2 ${formData.role === 'seller' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${formData.role === 'seller' ? 'text-primary-600' : 'text-gray-600'}`}>
                        Sell Products
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <motion.button
                    type="button"
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary flex items-center"
                  >
                    <HiArrowLeft className="mr-2" />
                    Previous
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center"
                  >
                    Next Step
                    <HiArrowRight className="ml-2" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Address Information */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Address Information
                </h3>

                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <HiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      onBlur={() => handleBlur('address.street')}
                      className={`
                        w-full pl-10 pr-3 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched['address.street'] && errors['address.street'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="123 Main Street"
                    />
                  </div>
                  {touched['address.street'] && errors['address.street'] && (
                    <p className="mt-1 text-xs text-red-600">{errors['address.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      onBlur={() => handleBlur('address.city')}
                      className={`
                        w-full px-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched['address.city'] && errors['address.city'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="Mumbai"
                    />
                    {touched['address.city'] && errors['address.city'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['address.city']}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      onBlur={() => handleBlur('address.state')}
                      className={`
                        w-full px-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched['address.state'] && errors['address.state'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="Maharashtra"
                    />
                    {touched['address.state'] && errors['address.state'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['address.state']}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      onBlur={() => handleBlur('address.zipCode')}
                      className={`
                        w-full px-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        transition-all duration-300
                        ${touched['address.zipCode'] && errors['address.zipCode'] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="400001"
                    />
                    {touched['address.zipCode'] && errors['address.zipCode'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['address.zipCode']}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <motion.button
                    type="button"
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary flex items-center"
                  >
                    <HiArrowLeft className="mr-2" />
                    Previous
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center"
                  >
                    Next Step
                    <HiArrowRight className="ml-2" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Review & Confirm
                </h3>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <HiUser className="mr-2 text-primary-600" />
                      Account Information
                    </h4>
                    <p className="text-sm text-gray-600">Name: {formData.name}</p>
                    <p className="text-sm text-gray-600">Email: {formData.email}</p>
                    <p className="text-sm text-gray-600">Role: {formData.role === 'client' ? 'Buyer' : 'Seller'}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <HiIdentification className="mr-2 text-primary-600" />
                      Personal Information
                    </h4>
                    <p className="text-sm text-gray-600">Phone: {formData.phoneNumber}</p>
                    <p className="text-sm text-gray-600">Date of Birth: {formData.dateOfBirth || 'Not provided'}</p>
                    <p className="text-sm text-gray-600">Gender: {formData.gender || 'Not specified'}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <HiHome className="mr-2 text-primary-600" />
                      Address
                    </h4>
                    <p className="text-sm text-gray-600">{formData.address.street}</p>
                    <p className="text-sm text-gray-600">
                      {formData.address.city}, {formData.address.state} - {formData.address.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">{formData.address.country}</p>
                  </motion.div>
                </div>

                {/* Terms and Newsletter */}
                <div className="space-y-3 pt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I want to receive newsletters and promotional offers
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I accept the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                        Terms and Conditions
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-xs text-red-600">{errors.termsAccepted}</p>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <motion.button
                    type="button"
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary flex items-center"
                  >
                    <HiArrowLeft className="mr-2" />
                    Previous
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <HiCheckCircle className="ml-2" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Social Registration */}
        <motion.div 
          variants={stepVariants}
          className="mt-8"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or register with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSocialRegister('Google')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSocialRegister('Facebook')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaFacebook className="h-5 w-5 text-blue-600" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSocialRegister('Apple')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaApple className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Login Link */}
        <motion.div 
          variants={stepVariants}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>

        {/* Security Badge */}
        <motion.div 
          variants={stepVariants}
          className="mt-6 flex items-center justify-center text-xs text-gray-500"
        >
          <BsShieldCheck className="mr-1 text-green-600" />
          Your information is secure and encrypted
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;