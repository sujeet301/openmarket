import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineChartSquareBar,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineTruck,
  
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineGift,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDotsVertical,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineQuestionMarkCircle
} from 'react-icons/hi';
import { FaStore, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState({
    dashboard: true,
    products: false,
    orders: false,
    analytics: false
  });
  const [stats, setStats] = useState({
    revenue: { total: 0, change: 0 },
    orders: { total: 0, change: 0 },
    customers: { total: 0, change: 0 },
    products: { total: 0, change: 0 },
    averageOrderValue: { total: 0, change: 0 },
    conversionRate: { total: 0, change: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    salesData: [],
    categoryData: [],
    trafficData: []
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'newest',
    page: 1,
    limit: 10
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storeDescription: '',
    storeLogo: '',
    storeBanner: '',
    shippingPolicy: '',
    returnPolicy: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: ''
    }
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      navigate('/');
    } else if (user) {
      fetchDashboardData();
      fetchStoreSettings();
    }
  }, [user, authLoading, navigate, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const [statsRes, ordersRes, productsRes, analyticsRes] = await Promise.all([
        api.get(`/seller/stats?range=${dateRange}`),
        api.get('/seller/orders?limit=5'),
        api.get('/seller/products?limit=5'),
        api.get(`/seller/analytics?range=${dateRange}`)
      ]);

      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setTopProducts(productsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showNotification('error', 'Failed to load dashboard');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  const fetchProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await api.get('/seller/products', { params: filters });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showNotification('error', 'Failed to load products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const response = await api.get('/seller/orders', { params: filters });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showNotification('error', 'Failed to load orders');
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await api.get('/seller/settings');
      setStoreSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    }
  };

  const handleProductAction = async (product, action) => {
    try {
      if (action === 'delete') {
        await api.delete(`/seller/products/${product._id}`);
        setProducts(products.filter(p => p._id !== product._id));
        showNotification('success', 'Product deleted successfully');
        setShowDeleteConfirm(null);
      } else if (action === 'toggle') {
        await api.put(`/seller/products/${product._id}/toggle`);
        setProducts(products.map(p => 
          p._id === product._id ? { ...p, isActive: !p.isActive } : p
        ));
        showNotification('success', `Product ${product.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      showNotification('error', `Failed to ${action} product`);
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      await api.put(`/seller/orders/${orderId}/status`, { status });
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
      showNotification('success', 'Order status updated');
    } catch (error) {
      showNotification('error', 'Failed to update order status');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct._id}`, productData);
        showNotification('success', 'Product updated successfully');
      } else {
        await api.post('/seller/products', productData);
        showNotification('success', 'Product added successfully');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      showNotification('error', `Failed to ${editingProduct ? 'update' : 'add'} product`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/seller/settings', storeSettings);
      showNotification('success', 'Store settings updated');
    } catch (error) {
      showNotification('error', 'Failed to update settings');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Chart data
  const salesChartData = {
    labels: analytics.salesData?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Sales',
        data: analytics.salesData?.map(d => d.sales) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Orders',
        data: analytics.salesData?.map(d => d.orders) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const categoryChartData = {
    labels: analytics.categoryData?.map(c => c.name) || [],
    datasets: [
      {
        data: analytics.categoryData?.map(c => c.sales) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
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

  const statCardVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaStore className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>
                <p className="text-sm text-gray-500">{storeSettings.storeName || user?.name}'s Store</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <HiOutlineRefresh className="w-5 h-5 text-gray-600" />
              </button>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <HiOutlineBell className="w-5 h-5 text-gray-600" />
              </button>
              
              <Link
                to="/profile"
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <img
                  src={user?.profilePicture || '/default-avatar.png'}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-6 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: HiOutlineChartBar },
              { id: 'products', label: 'Products', icon: HiOutlineCube },
              { id: 'orders', label: 'Orders', icon: HiOutlineShoppingBag },
              { id: 'analytics', label: 'Analytics', icon: HiOutlineChartPie },
              { id: 'settings', label: 'Store Settings', icon: HiOutlineCog }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    title: 'Total Revenue',
                    value: formatCurrency(stats.revenue.total),
                    change: stats.revenue.change,
                    icon: HiOutlineCurrencyDollar,
                    color: 'from-green-500 to-green-600'
                  },
                  {
                    title: 'Total Orders',
                    value: stats.orders.total,
                    change: stats.orders.change,
                    icon: HiOutlineShoppingBag,
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    title: 'Total Customers',
                    value: stats.customers.total,
                    change: stats.customers.change,
                    icon: HiOutlineUsers,
                    color: 'from-purple-500 to-purple-600'
                  },
                  {
                    title: 'Total Products',
                    value: stats.products.total,
                    change: stats.products.change,
                    icon: HiOutlineCube,
                    color: 'from-yellow-500 to-yellow-600'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={statCardVariants}
                    whileHover="hover"
                    className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-8 h-8 opacity-75" />
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        stat.change >= 0 ? 'bg-green-400' : 'bg-red-400'
                      }`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                      </span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm opacity-75">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3>
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-1 bg-gray-100 rounded-full">Sales</button>
                      <button className="text-xs px-3 py-1 hover:bg-gray-100 rounded-full">Orders</button>
                    </div>
                  </div>
                  <div className="h-80">
                    {loading.dashboard ? (
                      <LoadingSpinner />
                    ) : (
                      <Line data={salesChartData} options={chartOptions} />
                    )}
                  </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales by Category</h3>
                  <div className="h-80">
                    {loading.dashboard ? (
                      <LoadingSpinner />
                    ) : (
                      <Doughnut data={categoryChartData} options={{
                        ...chartOptions,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom'
                          }
                        }
                      }} />
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Recent Orders */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                  <Link
                    to="#"
                    onClick={() => setActiveTab('orders')}
                    className="text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    View All
                    <HiOutlineArrowRight className="ml-1" />
                  </Link>
                </div>

                {loading.dashboard ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-800">Order #{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600">{formatCurrency(order.total)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Top Products */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Top Products</h3>
                  <Link
                    to="#"
                    onClick={() => setActiveTab('products')}
                    className="text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    View All
                    <HiOutlineArrowRight className="ml-1" />
                  </Link>
                </div>

                {loading.dashboard ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
                      >
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{product.name}</h4>
                          <p className="text-sm text-gray-500">Sold: {product.soldQuantity}</p>
                        </div>
                        <p className="font-bold text-primary-600">{formatCurrency(product.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Products Header */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Manage Products</h2>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setShowProductModal(true);
                      }}
                      className="btn-primary flex items-center"
                    >
                      <HiOutlinePlus className="mr-2" />
                      Add Product
                    </button>
                    
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <HiOutlineUpload className="w-5 h-5" />
                    </button>
                    
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <HiOutlineDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                  
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={itemVariants}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Status Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                        product.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </div>
                      
                      {/* Actions Menu */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => setShowDeleteConfirm(product._id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                        >
                          <HiOutlineDotsVertical className="w-4 h-4" />
                        </button>
                        
                        <AnimatePresence>
                          {showDeleteConfirm === product._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10"
                            >
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowProductModal(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                              >
                                <HiOutlinePencil className="mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleProductAction(product, 'toggle')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                              >
                                {product.isActive ? (
                                  <>
                                    <HiOutlineXCircle className="mr-2 text-red-500" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineCheckCircle className="mr-2 text-green-500" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleProductAction(product, 'delete')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center"
                              >
                                <HiOutlineTrash className="mr-2" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock: {product.quantity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <HiOutlineEye className="mr-1" />
                          {product.views}
                        </span>
                        <span className="flex items-center">
                          <HiOutlineHeart className="mr-1" />
                          {product.wishlistCount || 0}
                        </span>
                        <span className="flex items-center">
                          <HiOutlineShoppingBag className="mr-1" />
                          {product.soldQuantity}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2">
                <button className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50">
                  <HiOutlineArrowLeft className="w-5 h-5 mx-auto" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-primary-600 text-white">1</button>
                <button className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50">2</button>
                <button className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50">3</button>
                <button className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50">
                  <HiOutlineArrowRight className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Manage Orders</h2>

              <div className="space-y-4">
                {orders.map((order) => (
                  <motion.div
                    key={order._id}
                    variants={itemVariants}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-gray-800">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                          className={`text-sm px-3 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <span className="font-bold text-primary-600">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                      {order.items?.map((item) => (
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
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button className="text-sm text-gray-600 hover:text-primary-600">
                        View Details
                      </button>
                      <button className="text-sm text-gray-600 hover:text-primary-600">
                        Contact Customer
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Performance Metrics */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'Average Order Value', value: formatCurrency(stats.averageOrderValue.total), change: stats.averageOrderValue.change },
                    { label: 'Conversion Rate', value: `${stats.conversionRate.total}%`, change: stats.conversionRate.change },
                    { label: 'Customer Retention', value: '75%', change: 5 },
                    { label: 'Return Rate', value: '2.5%', change: -1 }
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{metric.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{metric.value}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          metric.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {metric.change >= 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Traffic Sources */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Traffic Sources</h3>
                
                <div className="space-y-4">
                  {[
                    { source: 'Direct', visitors: 1250, conversion: 3.2 },
                    { source: 'Search', visitors: 3450, conversion: 4.5 },
                    { source: 'Social', visitors: 890, conversion: 2.1 },
                    { source: 'Email', visitors: 560, conversion: 5.8 },
                    { source: 'Referral', visitors: 780, conversion: 3.9 }
                  ].map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{source.source}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{source.visitors} visits</span>
                        <span className="text-sm font-medium text-green-600">{source.conversion}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Sales by Day */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Day</h3>
                <div className="h-80">
                  <Bar data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                      label: 'Sales',
                      data: [4500, 5200, 4800, 5800, 6300, 7100, 6900],
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderRadius: 8
                    }]
                  }} options={chartOptions} />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {/* Store Information */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Store Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Description
                    </label>
                    <textarea
                      value={storeSettings.storeDescription}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Store Media */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Store Media</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Logo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {storeSettings.storeLogo ? (
                        <img
                          src={storeSettings.storeLogo}
                          alt="Store Logo"
                          className="w-24 h-24 mx-auto object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <HiOutlineUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Upload Logo
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Banner
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {storeSettings.storeBanner ? (
                        <img
                          src={storeSettings.storeBanner}
                          alt="Store Banner"
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <HiOutlineUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Upload Banner
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Policies */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Store Policies</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Policy
                    </label>
                    <textarea
                      value={storeSettings.shippingPolicy}
                      onChange={(e) => setStoreSettings({ ...storeSettings, shippingPolicy: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Policy
                    </label>
                    <textarea
                      value={storeSettings.returnPolicy}
                      onChange={(e) => setStoreSettings({ ...storeSettings, returnPolicy: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Media Links</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaFacebook className="w-5 h-5 text-blue-600" />
                    <input
                      type="url"
                      placeholder="Facebook URL"
                      value={storeSettings.socialLinks?.facebook}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        socialLinks: { ...storeSettings.socialLinks, facebook: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaTwitter className="w-5 h-5 text-blue-400" />
                    <input
                      type="url"
                      placeholder="Twitter URL"
                      value={storeSettings.socialLinks?.twitter}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        socialLinks: { ...storeSettings.socialLinks, twitter: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaInstagram className="w-5 h-5 text-pink-600" />
                    <input
                      type="url"
                      placeholder="Instagram URL"
                      value={storeSettings.socialLinks?.instagram}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        socialLinks: { ...storeSettings.socialLinks, instagram: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                variants={itemVariants}
                className="flex justify-end"
              >
                <button
                  onClick={handleSaveSettings}
                  className="btn-primary px-8"
                >
                  Save Changes
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const productData = Object.fromEntries(formData);
                handleSaveProduct(productData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingProduct?.description}
                      rows="4"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        name="price"
                        defaultValue={editingProduct?.price}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compare at Price ($)
                      </label>
                      <input
                        type="number"
                        name="compareAtPrice"
                        defaultValue={editingProduct?.compareAtPrice}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        defaultValue={editingProduct?.quantity || 0}
                        min="0"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        defaultValue={editingProduct?.sku}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={editingProduct?.category}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Category</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Living</option>
                      <option value="beauty">Beauty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <HiOutlineUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        Drag and drop images here, or click to select
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingProduct ? 'Update' : 'Save'} Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerDashboard;