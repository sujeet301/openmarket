import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdmin } from '../auth/AdminRoute';
import api from '../../utils/api';
import {
  HiUserGroup,
  HiShoppingBag,
  HiCurrencyDollar,
  HiChartBar,
  HiTrendingUp,
  HiTrendingDown,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiCog,
  HiRefresh,
  HiArrowRight,
  HiDocumentText,
  HiPhotograph,
  HiStar,
  HiFire,
  HiSparkles,
  HiCash,
  HiCreditCard,
  HiGift,
  HiGlobe,
  HiMap,
  HiLocationMarker,
  HiSupport,
  HiQuestionMarkCircle,
  HiInformationCircle,
  HiBookOpen,
  HiAcademicCap,
  HiBeaker,
  HiChip,
  HiCode,
  HiDeviceMobile,
  HiDesktopComputer,
  HiDeviceTablet,
  HiCalendar
} from 'react-icons/hi';
import { FaCrown, FaStore, FaUsers, FaBoxes } from 'react-icons/fa';

const AdminDashboard = () => {
  const { adminLevel, adminPermissions } = useAdmin();
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0 },
    products: { total: 0, pending: 0, outOfStock: 0 },
    orders: { total: 0, pending: 0, completed: 0, revenue: 0 },
    sellers: { total: 0, verified: 0, pending: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/dashboard?range=${timeRange}`);
      setStats(response.data.data.stats);
      setRecentActivities(response.data.data.recentActivities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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

  const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
    <motion.div
      variants={statCardVariants}
      whileHover="hover"
      className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-6 text-white overflow-hidden relative`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          <Icon className="w-5 h-5 opacity-90" />
        </div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs opacity-75">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            {trend > 0 ? (
              <HiTrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <HiTrendingDown className="w-3 h-3 mr-1" />
            )}
            <span>{Math.abs(trend)}% from last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const ActivityItem = ({ activity }) => (
    <motion.div
      variants={itemVariants}
      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className={`p-2 rounded-lg ${
        activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
        activity.type === 'product' ? 'bg-green-100 text-green-600' :
        activity.type === 'order' ? 'bg-purple-100 text-purple-600' :
        'bg-yellow-100 text-yellow-600'
      }`}>
        {activity.type === 'user' && <HiUserGroup className="w-4 h-4" />}
        {activity.type === 'product' && <HiShoppingBag className="w-4 h-4" />}
        {activity.type === 'order' && <HiCurrencyDollar className="w-4 h-4" />}
        {activity.type === 'seller' && <FaStore className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{activity.description}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <HiClock className="w-3 h-3 mr-1" />
          {activity.time}
        </div>
      </div>
      {activity.status && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          activity.status === 'success' ? 'bg-green-100 text-green-700' :
          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {activity.status}
        </span>
      )}
    </motion.div>
  );

  const QuickAction = ({ icon: Icon, title, link, color }) => (
    <Link to={link}>
      <motion.div
        whileHover={{ scale: 1.02, x: 5 }}
        className={`flex items-center p-3 ${color} rounded-lg cursor-pointer group`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className="flex-1 text-sm font-medium">{title}</span>
        <HiArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
              <div className="h-96 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, Admin Level {adminLevel} • {adminPermissions.length} permissions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <HiRefresh className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            icon={HiUserGroup}
            color="from-blue-600 to-blue-400"
            trend={12}
            subtitle={`${stats.users.new} new today`}
          />
          <StatCard
            title="Total Products"
            value={stats.products.total.toLocaleString()}
            icon={HiShoppingBag}
            color="from-green-600 to-green-400"
            trend={8}
            subtitle={`${stats.products.pending} pending`}
          />
          <StatCard
            title="Total Orders"
            value={stats.orders.total.toLocaleString()}
            icon={HiCurrencyDollar}
            color="from-purple-600 to-purple-400"
            trend={-3}
            subtitle={`${stats.orders.pending} pending`}
          />
          <StatCard
            title="Revenue"
            value={`$${stats.orders.revenue.toLocaleString()}`}
            icon={HiCash}
            color="from-yellow-600 to-yellow-400"
            trend={15}
            subtitle="This period"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
              <Link to="/admin/activities" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </motion.div>

          {/* Quick Actions & Stats */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Admin Level Card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FaCrown className="w-8 h-8 opacity-75" />
                <span className="text-sm opacity-75">Level {adminLevel}/5</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Admin Level {adminLevel}</h3>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(adminLevel / 5) * 100}%` }}
                  className="bg-white h-2 rounded-full"
                />
              </div>
              <p className="text-sm opacity-90">
                {adminLevel === 5 ? 'Maximum privileges' : `${5 - adminLevel} levels to max`}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <QuickAction
                  icon={HiUserGroup}
                  title="Manage Users"
                  link="/admin/users"
                  color="text-blue-600 hover:bg-blue-50"
                />
                <QuickAction
                  icon={HiShoppingBag}
                  title="Manage Products"
                  link="/admin/products"
                  color="text-green-600 hover:bg-green-50"
                />
                <QuickAction
                  icon={FaStore}
                  title="Verify Sellers"
                  link="/admin/sellers"
                  color="text-purple-600 hover:bg-purple-50"
                />
                <QuickAction
                  icon={HiDocumentText}
                  title="View Reports"
                  link="/admin/reports"
                  color="text-yellow-600 hover:bg-yellow-50"
                />
                <QuickAction
                  icon={HiCog}
                  title="System Settings"
                  link="/admin/settings"
                  color="text-gray-600 hover:bg-gray-50"
                />
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Server Status</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache</span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    Degraded
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Queue</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    0 pending
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;