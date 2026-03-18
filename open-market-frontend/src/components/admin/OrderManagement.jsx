import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlinePrinter,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDownload,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineCreditCard,
  HiOutlineArchive,
  HiOutlineArrowRight,
  HiOutlineX
} from 'react-icons/hi';

const OrderManagement = () => {
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    sort: 'newest',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders', { params: filters });
      setOrders(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalOrders(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showNotification('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/orders/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      showNotification('success', `Order status updated to ${newStatus}`);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to update order status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { paymentStatus: newStatus });
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, paymentStatus: newStatus } : order
      ));
      showNotification('success', `Payment status updated to ${newStatus}`);
    } catch (error) {
      showNotification('error', 'Failed to update payment status');
    }
  };

  const handleAddTracking = async (orderId, trackingNumber) => {
    try {
      await api.post(`/admin/orders/${orderId}/tracking`, { trackingNumber });
      showNotification('success', 'Tracking number added');
      fetchOrders();
    } catch (error) {
      showNotification('error', 'Failed to add tracking');
    }
  };

  const handleProcessRefund = async (orderId, amount) => {
    if (!window.confirm(`Process refund of $${amount}?`)) return;
    
    try {
      await api.post(`/admin/orders/${orderId}/refund`, { amount });
      showNotification('success', 'Refund processed successfully');
      fetchOrders();
    } catch (error) {
      showNotification('error', 'Failed to process refund');
    }
  };

  const handleExportOrders = () => {
    const data = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer': order.user?.name || 'Guest',
      'Email': order.user?.email || order.guestEmail,
      'Total': order.totalAmount,
      'Status': order.status,
      'Payment': order.paymentStatus,
      'Items': order.items?.length || 0
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped': return <HiOutlineTruck className="w-5 h-5 text-blue-500" />;
      case 'processing': return <HiOutlineRefresh className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'cancelled': return <HiOutlineXCircle className="w-5 h-5 text-red-500" />;
      default: return <HiOutlineClock className="w-5 h-5 text-gray-500" />;
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

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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

  if (loading && orders.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">Processing</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-500">Shipped</p>
            <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-green-400">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 bg-primary-50">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.revenue)}</p>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>

            <button
              onClick={fetchOrders}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <HiOutlineRefresh className="w-5 h-5" />
            </button>

            <button
              onClick={handleExportOrders}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export to CSV"
            >
              <HiOutlineDownload className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <motion.tr
                    key={order._id}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium text-gray-800">#{order.orderNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{order.user?.name || 'Guest'}</p>
                        <p className="text-sm text-gray-500">{order.user?.email || order.guestEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <HiOutlineShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{order.items?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary-600">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded-full border-0 ${getPaymentStatusColor(order.paymentStatus)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/admin/orders/${order._id}/invoice`, '_blank')}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Print Invoice"
                        >
                          <HiOutlinePrinter className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalOrders)} of {totalOrders} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <HiOutlineChevronLeft className="w-5 h-5 mx-auto" />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`w-10 h-10 rounded-lg ${
                    filters.page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === totalPages}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <HiOutlineChevronRight className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-bold text-gray-800">#{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-gray-800">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-primary-600">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedOrder.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center">
                        <HiOutlineUser className="mr-2" />
                        Customer Details
                      </h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">Name:</span> {selectedOrder.user?.name || selectedOrder.guestName || 'Guest'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Email:</span> {selectedOrder.user?.email || selectedOrder.guestEmail}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress?.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 flex items-center">
                        <HiOutlineCreditCard className="mr-2" />
                        Payment Details
                      </h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">Method:</span> {selectedOrder.paymentMethod}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                            {selectedOrder.paymentStatus}
                          </span>
                        </p>
                        {selectedOrder.paymentDetails?.transactionId && (
                          <p className="text-gray-600">
                            <span className="font-medium">Transaction ID:</span> {selectedOrder.paymentDetails.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <HiOutlineLocationMarker className="mr-2" />
                      Shipping Address
                    </h3>
                    <p className="text-gray-600">
                      {selectedOrder.shippingAddress?.street}<br />
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
                      {selectedOrder.shippingAddress?.country}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <HiOutlineShoppingBag className="mr-2" />
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.product?.name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-primary-600">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const tracking = prompt('Enter tracking number:');
                        if (tracking) handleAddTracking(selectedOrder._id, tracking);
                      }}
                      className="flex-1 btn-primary"
                    >
                      Add Tracking
                    </button>
                    <button
                      onClick={() => {
                        if (selectedOrder.paymentStatus === 'completed') {
                          handleProcessRefund(selectedOrder._id, selectedOrder.totalAmount);
                        }
                      }}
                      disabled={selectedOrder.paymentStatus !== 'completed'}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Process Refund
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderManagement;