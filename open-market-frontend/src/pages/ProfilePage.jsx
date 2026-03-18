import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineUser,
  HiOutlineUserCircle,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineHome,
  HiOutlineBriefcase,
  
  HiOutlineCalendar,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineStar,
  HiOutlineEye,
  
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineTicket,
  HiOutlineBookmark,
  HiOutlineBell,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineCamera,
  HiOutlineUpload,
  HiOutlineSave,
  HiOutlineArrowLeft,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    profilePicture: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState({
    profile: false,
    addresses: false,
    orders: false,
    payments: false
  });
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNumber: '',
    isDefault: false
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newsletter: true,
    twoFactorAuth: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      profilePicture: user.profilePicture || '/default-avatar.png'
    });

    await Promise.all([
      fetchAddresses(),
      fetchOrders(),
      fetchPayments()
    ]);
  };

  const fetchAddresses = async () => {
    setLoading(prev => ({ ...prev, addresses: true }));
    try {
      const response = await api.get('/users/addresses');
      setAddresses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(prev => ({ ...prev, addresses: false }));
    }
  };

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchPayments = async () => {
    setLoading(prev => ({ ...prev, payments: true }));
    try {
      const response = await api.get('/payments/history');
      setPayments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateUser(editedProfile);
      setProfileData({ ...profileData, ...editedProfile });
      setIsEditingProfile(false);
      showNotification('success', 'Profile updated successfully');
    } catch (error) {
      showNotification('error', 'Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    try {
      const response = await api.post('/users/addresses', newAddress);
      setAddresses([...addresses, response.data.data]);
      setShowAddressForm(false);
      setNewAddress({
        type: 'home',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        phoneNumber: '',
        isDefault: false
      });
      showNotification('success', 'Address added successfully');
    } catch (error) {
      showNotification('error', 'Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    try {
      const response = await api.put(`/users/addresses/${editingAddress._id}`, editingAddress);
      setAddresses(addresses.map(addr => 
        addr._id === editingAddress._id ? response.data.data : addr
      ));
      setEditingAddress(null);
      showNotification('success', 'Address updated successfully');
    } catch (error) {
      showNotification('error', 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.delete(`/users/addresses/${addressId}`);
        setAddresses(addresses.filter(addr => addr._id !== addressId));
        showNotification('success', 'Address deleted successfully');
      } catch (error) {
        showNotification('error', 'Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await api.put(`/users/addresses/${addressId}/default`);
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      })));
      showNotification('success', 'Default address updated');
    } catch (error) {
      showNotification('error', 'Failed to set default address');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showNotification('success', 'Password changed successfully');
    } catch (error) {
      showNotification('error', 'Failed to change password');
    }
  };

  const handlePreferenceChange = async (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    try {
      await api.put('/users/preferences', { [key]: value });
      showNotification('success', 'Preferences updated');
    } catch (error) {
      showNotification('error', 'Failed to update preferences');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getOrderStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const tabVariants = {
    active: {
      scale: 1.05,
      backgroundColor: "rgb(37, 99, 235)",
      color: "white"
    },
    inactive: {
      scale: 1,
      backgroundColor: "transparent",
      color: "rgb(75, 85, 99)"
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800">My Account</h1>
          <p className="text-gray-500 mt-1">Manage your profile, orders, and settings</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              {/* Profile Summary */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={profileData.profilePicture}
                    alt={profileData.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                  />
                  <button
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                  >
                    <HiOutlineCamera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mt-4">{profileData.name}</h2>
                <p className="text-gray-500 text-sm">{profileData.email}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {[
                  { id: 'overview', icon: HiOutlineUser, label: 'Overview' },
                  { id: 'orders', icon: HiOutlineShoppingBag, label: 'Orders', badge: orders.length },
                  { id: 'wishlist', icon: HiOutlineHeart, label: 'Wishlist', badge: wishlist.length },
                  { id: 'addresses', icon: HiOutlineLocationMarker, label: 'Addresses', badge: addresses.length },
                  { id: 'payments', icon: HiOutlineCreditCard, label: 'Payment Methods', badge: payments.length },
                  { id: 'settings', icon: HiOutlineCog, label: 'Settings' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    variants={tabVariants}
                    animate={activeTab === tab.id ? 'active' : 'inactive'}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
                  >
                    <div className="flex items-center">
                      <tab.icon className="w-5 h-5 mr-3" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge > 0 && (
                      <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 mt-6 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <HiOutlineLogout className="w-5 h-5 mr-2" />
                Logout
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Profile Info Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => {
                            setEditedProfile(profileData);
                            setIsEditingProfile(true);
                          }}
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <HiOutlinePencil className="mr-1" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleProfileUpdate}
                            className="text-green-600 hover:text-green-700 flex items-center"
                          >
                            <HiOutlineCheck className="mr-1" />
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="text-red-600 hover:text-red-700 flex items-center"
                          >
                            <HiOutlineX className="mr-1" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500">Full Name</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editedProfile.name}
                              onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <p className="text-gray-800 font-medium">{profileData.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">Email</label>
                          {isEditingProfile ? (
                            <input
                              type="email"
                              value={editedProfile.email}
                              onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <p className="text-gray-800 font-medium">{profileData.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">Phone Number</label>
                          {isEditingProfile ? (
                            <input
                              type="tel"
                              value={editedProfile.phoneNumber}
                              onChange={(e) => setEditedProfile({ ...editedProfile, phoneNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <p className="text-gray-800 font-medium">{profileData.phoneNumber || 'Not provided'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">Date of Birth</label>
                          {isEditingProfile ? (
                            <input
                              type="date"
                              value={editedProfile.dateOfBirth}
                              onChange={(e) => setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <p className="text-gray-800 font-medium">
                              {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
                    >
                      <HiOutlineShoppingBag className="w-8 h-8 mb-3 opacity-75" />
                      <p className="text-3xl font-bold">{orders.length}</p>
                      <p className="text-sm opacity-90">Total Orders</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
                    >
                      <HiOutlineHeart className="w-8 h-8 mb-3 opacity-75" />
                      <p className="text-3xl font-bold">{wishlist.length}</p>
                      <p className="text-sm opacity-90">Wishlist Items</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
                    >
                      <HiOutlineLocationMarker className="w-8 h-8 mb-3 opacity-75" />
                      <p className="text-3xl font-bold">{addresses.length}</p>
                      <p className="text-sm opacity-90">Saved Addresses</p>
                    </motion.div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
                      <Link
                        to="/orders"
                        className="text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        View All
                        <HiOutlineArrowRight className="ml-1" />
                      </Link>
                    </div>

                    {loading.orders ? (
                      <div className="text-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <Link
                            key={order._id}
                            to={`/orders/${order._id}`}
                            className="block hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium text-gray-800">Order #{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary-600">${order.totalAmount}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No orders yet</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Order History</h2>
                  
                  {loading.orders ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <motion.div
                          key={order._id}
                          whileHover={{ scale: 1.01 }}
                          className="border border-gray-200 rounded-xl p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-800">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-3 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              <span className="font-bold text-primary-600">${order.totalAmount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 overflow-x-auto pb-2">
                            {order.items?.slice(0, 3).map((item) => (
                              <div key={item._id} className="flex items-center gap-2 flex-shrink-0">
                                <img
                                  src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                                  alt={item.product?.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{item.product?.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="flex justify-end mt-3">
                            <Link
                              to={`/orders/${order._id}`}
                              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                            >
                              View Details
                              <HiOutlineArrowRight className="ml-1" />
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HiOutlineShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No orders yet</p>
                      <Link to="/shop" className="btn-primary inline-flex">
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">My Wishlist</h2>
                  
                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wishlist.map((item) => (
                        <motion.div
                          key={item._id}
                          whileHover={{ y: -5 }}
                          className="border border-gray-200 rounded-xl p-4 flex gap-4"
                        >
                          <img
                            src={item.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <Link to={`/product/${item._id}`}>
                              <h3 className="font-medium text-gray-800 hover:text-primary-600">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-primary-600 font-bold mt-1">${item.price}</p>
                            <button
                              onClick={() => addToCart(item, 1)}
                              className="mt-2 text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HiOutlineHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                      <Link to="/shop" className="btn-primary inline-flex">
                        Explore Products
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <HiOutlinePlus className="mr-1" />
                      Add New
                    </button>
                  </div>

                  {loading.addresses ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <motion.div
                          key={address._id}
                          whileHover={{ scale: 1.01 }}
                          className="border border-gray-200 rounded-xl p-4 relative"
                        >
                          {address.isDefault && (
                            <span className="absolute top-4 right-4 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              address.type === 'home' ? 'bg-blue-100 text-blue-600' :
                              address.type === 'work' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {address.type === 'home' ? <HiOutlineHome className="w-5 h-5" /> :
                               address.type === 'work' ? <HiOutlineBriefcase className="w-5 h-5" /> :
                               <HiOutlineLocationMarker className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {address.street}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} - {address.zipCode}
                              </p>
                              <p className="text-sm text-gray-600">{address.country}</p>
                              <p className="text-sm text-gray-500 mt-1">Phone: {address.phoneNumber}</p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(address._id)}
                                className="text-sm text-gray-600 hover:text-primary-600"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={() => setEditingAddress(address)}
                              className="text-sm text-gray-600 hover:text-primary-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {addresses.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No addresses saved</p>
                      )}
                    </div>
                  )}

                  {/* Add/Edit Address Modal */}
                  <AnimatePresence>
                    {(showAddressForm || editingAddress) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-2xl max-w-md w-full p-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-xl font-bold mb-4">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address Type
                              </label>
                              <div className="flex gap-3">
                                {['home', 'work', 'other'].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => editingAddress 
                                      ? setEditingAddress({ ...editingAddress, type })
                                      : setNewAddress({ ...newAddress, type })
                                    }
                                    className={`flex-1 py-2 px-3 rounded-lg border-2 capitalize ${
                                      (editingAddress ? editingAddress.type : newAddress.type) === type
                                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="Street Address"
                              value={editingAddress ? editingAddress.street : newAddress.street}
                              onChange={(e) => editingAddress
                                ? setEditingAddress({ ...editingAddress, street: e.target.value })
                                : setNewAddress({ ...newAddress, street: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="City"
                                value={editingAddress ? editingAddress.city : newAddress.city}
                                onChange={(e) => editingAddress
                                  ? setEditingAddress({ ...editingAddress, city: e.target.value })
                                  : setNewAddress({ ...newAddress, city: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              />
                              <input
                                type="text"
                                placeholder="State"
                                value={editingAddress ? editingAddress.state : newAddress.state}
                                onChange={(e) => editingAddress
                                  ? setEditingAddress({ ...editingAddress, state: e.target.value })
                                  : setNewAddress({ ...newAddress, state: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="ZIP Code"
                                value={editingAddress ? editingAddress.zipCode : newAddress.zipCode}
                                onChange={(e) => editingAddress
                                  ? setEditingAddress({ ...editingAddress, zipCode: e.target.value })
                                  : setNewAddress({ ...newAddress, zipCode: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              />
                              <input
                                type="text"
                                placeholder="Country"
                                value={editingAddress ? editingAddress.country : newAddress.country}
                                onChange={(e) => editingAddress
                                  ? setEditingAddress({ ...editingAddress, country: e.target.value })
                                  : setNewAddress({ ...newAddress, country: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              />
                            </div>

                            <input
                              type="tel"
                              placeholder="Phone Number"
                              value={editingAddress ? editingAddress.phoneNumber : newAddress.phoneNumber}
                              onChange={(e) => editingAddress
                                ? setEditingAddress({ ...editingAddress, phoneNumber: e.target.value })
                                : setNewAddress({ ...newAddress, phoneNumber: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingAddress ? editingAddress.isDefault : newAddress.isDefault}
                                onChange={(e) => editingAddress
                                  ? setEditingAddress({ ...editingAddress, isDefault: e.target.checked })
                                  : setNewAddress({ ...newAddress, isDefault: e.target.checked })
                                }
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Set as default address</span>
                            </label>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                              className="flex-1 btn-primary"
                            >
                              {editingAddress ? 'Update' : 'Save'} Address
                            </button>
                            <button
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                              }}
                              className="flex-1 btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods</h2>
                  
                  {loading.payments ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment._id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <HiOutlineCreditCard className="w-8 h-8 text-primary-600" />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {payment.cardType} •••• {payment.last4}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Expires {payment.expiryMonth}/{payment.expiryYear}
                                </p>
                              </div>
                            </div>
                            {payment.isDefault && (
                              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HiOutlineCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No payment methods saved</p>
                      <button className="btn-primary inline-flex">
                        Add Payment Method
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Password Change */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Security</h3>
                      {!showChangePassword ? (
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <HiOutlineKey className="mr-1" />
                          Change Password
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowChangePassword(false)}
                          className="text-red-600 hover:text-red-700 flex items-center"
                        >
                          <HiOutlineX className="mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showChangePassword && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <input
                            type="password"
                            placeholder="Current Password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            type="password"
                            placeholder="New Password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            onClick={handleChangePassword}
                            className="w-full btn-primary"
                          >
                            Update Password
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={preferences.twoFactorAuth}
                          onChange={(e) => handlePreferenceChange('twoFactorAuth', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 
                          peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 
                          after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                          after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications' },
                        { key: 'smsNotifications', label: 'SMS Notifications' },
                        { key: 'pushNotifications', label: 'Push Notifications' },
                        { key: 'newsletter', label: 'Newsletter' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <span className="text-gray-700">{item.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={preferences[item.key]}
                              onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 
                              peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 
                              after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connected Accounts */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Connected Accounts</h3>
                    
                    <div className="space-y-3">
                      {[
                        { icon: FaGoogle, name: 'Google', connected: false },
                        { icon: FaFacebook, name: 'Facebook', connected: true },
                        { icon: FaApple, name: 'Apple', connected: false }
                      ].map((account) => (
                        <div key={account.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <account.icon className="w-5 h-5" />
                            <span className="font-medium text-gray-700">{account.name}</span>
                          </div>
                          {account.connected ? (
                            <button className="text-sm text-red-600 hover:text-red-700">
                              Disconnect
                            </button>
                          ) : (
                            <button className="text-sm text-primary-600 hover:text-primary-700">
                              Connect
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;