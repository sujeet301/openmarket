import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineDuplicate,
  HiOutlineTag,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlinePhotograph,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineChartBar
} from 'react-icons/hi';

const ProductManagement = () => {
  const { showNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    approvalStatus: 'all',
    category: 'all',
    seller: 'all',
    stockStatus: 'all',
    sort: 'newest',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('approve');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    outOfStock: 0,
    lowStock: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSellers();
    fetchStats();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/products', { params: filters });
      setProducts(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showNotification('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get('/admin/sellers');
      setSellers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/products/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product stats:', error);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}`, { 
        status: 'approved',
        reviewedAt: new Date()
      });
      setProducts(products.map(p =>
        p._id === productId ? { ...p, status: 'approved' } : p
      ));
      showNotification('success', 'Product approved successfully');
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId) => {
    const reason = prompt('Please provide rejection reason:');
    if (!reason) return;

    try {
      await api.put(`/admin/products/${productId}`, { 
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date()
      });
      setProducts(products.map(p =>
        p._id === productId ? { ...p, status: 'rejected' } : p
      ));
      showNotification('success', 'Product rejected');
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to reject product');
    }
  };

  const handleToggleFeatured = async (productId, currentValue) => {
    try {
      await api.put(`/admin/products/${productId}`, { 
        isFeatured: !currentValue
      });
      setProducts(products.map(p =>
        p._id === productId ? { ...p, isFeatured: !currentValue } : p
      ));
      showNotification('success', `Product ${!currentValue ? 'featured' : 'unfeatured'}`);
    } catch (error) {
      showNotification('error', 'Failed to update product');
    }
  };

  const handleToggleActive = async (productId, currentValue) => {
    try {
      await api.put(`/admin/products/${productId}`, { 
        isActive: !currentValue
      });
      setProducts(products.map(p =>
        p._id === productId ? { ...p, isActive: !currentValue } : p
      ));
      showNotification('success', `Product ${!currentValue ? 'activated' : 'deactivated'}`);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/admin/products/${productToDelete}`);
      setProducts(products.filter(p => p._id !== productToDelete));
      showNotification('success', 'Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to delete product');
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const actions = {
        approve: { status: 'approved' },
        reject: { status: 'rejected' },
        feature: { isFeatured: true },
        unfeature: { isFeatured: false },
        activate: { isActive: true },
        deactivate: { isActive: false },
        delete: 'delete'
      };

      if (bulkAction === 'delete') {
        if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;
        await Promise.all(selectedProducts.map(id => api.delete(`/admin/products/${id}`)));
        setProducts(products.filter(p => !selectedProducts.includes(p._id)));
      } else {
        await Promise.all(selectedProducts.map(id => 
          api.put(`/admin/products/${id}`, actions[bulkAction])
        ));
        setProducts(products.map(p => 
          selectedProducts.includes(p._id) ? { ...p, ...actions[bulkAction] } : p
        ));
      }

      showNotification('success', `Bulk action completed on ${selectedProducts.length} products`);
      setSelectedProducts([]);
      setShowBulkActionModal(false);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to perform bulk action');
    }
  };

  const handleExportProducts = () => {
    const data = products.map(p => ({
      'Name': p.name,
      'SKU': p.sku,
      'Price': p.price,
      'Quantity': p.quantity,
      'Category': p.category?.name,
      'Seller': p.seller?.name,
      'Status': p.status,
      'Active': p.isActive ? 'Yes' : 'No',
      'Featured': p.isFeatured ? 'Yes' : 'No',
      'Views': p.views,
      'Sold': p.soldQuantity,
      'Rating': p.rating,
      'Created': new Date(p.createdAt).toLocaleDateString()
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">Approved</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">Pending</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Rejected</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return <span className="text-red-600 font-medium">Out of Stock</span>;
    if (quantity < 5) return <span className="text-yellow-600 font-medium">Low Stock ({quantity})</span>;
    return <span className="text-green-600 font-medium">In Stock ({quantity})</span>;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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

  if (loading && products.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-500 mt-1">Manage and moderate all products on the platform</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-green-400">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
          </motion.div>
        </motion.div>

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU, seller..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filters.seller}
              onChange={(e) => setFilters({ ...filters, seller: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Sellers</option>
              {sellers.map(seller => (
                <option key={seller._id} value={seller._id}>{seller.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
            </select>

            <button
              onClick={fetchProducts}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <HiOutlineRefresh className="w-5 h-5" />
            </button>

            <button
              onClick={handleExportProducts}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export to CSV"
            >
              <HiOutlineDownload className="w-5 h-5" />
            </button>

            {selectedProducts.length > 0 && (
              <button
                onClick={() => setShowBulkActionModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Bulk Actions ({selectedProducts.length})
              </button>
            )}
          </div>
        </motion.div>

        {/* Products Table */}
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
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(products.map(p => p._id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Seller</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Approval</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <motion.tr
                    key={product._id}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product._id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{product.seller?.name}</p>
                        <p className="text-xs text-gray-500">{product.seller?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.category?.name}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-primary-600">{formatCurrency(product.price)}</p>
                        {product.compareAtPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStockStatus(product.quantity)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {product.isActive ? (
                          <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <HiOutlineXCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.status)}
                      {product.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">{product.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs flex items-center">
                          <HiOutlineEye className="mr-1" /> {product.views || 0} views
                        </p>
                        <p className="text-xs flex items-center">
                          <HiOutlineShoppingBag className="mr-1" /> {product.soldQuantity || 0} sold
                        </p>
                        <p className="text-xs flex items-center">
                          <HiOutlineStar className="mr-1" /> {product.rating || 0} rating
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {product.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveProduct(product._id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                              title="Approve"
                            >
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectProduct(product._id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                              title="Reject"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                          className={`p-2 rounded-lg ${
                            product.isFeatured 
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={product.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                        >
                          <HiOutlineFire className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(product._id, product.isActive)}
                          className={`p-2 rounded-lg ${
                            product.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={product.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {product.isActive ? (
                            <HiOutlineCheckCircle className="w-4 h-4" />
                          ) : (
                            <HiOutlineXCircle className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          to={`/admin/products/edit/${product._id}`}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => {
                            setProductToDelete(product._id);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
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
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalProducts)} of {totalProducts} products
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

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Product</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteProduct}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Action Modal */}
        <AnimatePresence>
          {showBulkActionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={() => setShowBulkActionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Bulk Actions</h3>
                <p className="text-gray-600 mb-4">
                  Apply action to {selectedProducts.length} selected products
                </p>

                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="feature">Mark as Featured</option>
                  <option value="unfeature">Remove Featured</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="delete">Delete</option>
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkAction}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setShowBulkActionModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductManagement;