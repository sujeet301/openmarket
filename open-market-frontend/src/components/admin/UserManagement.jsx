import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineUserRemove,
  HiOutlineUserCircle,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineStar,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineCog,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineMailOpen,
  HiOutlinePhoneIncoming,
  HiOutlineLocationMarker,
  HiOutlineBuildingStorefront,
  HiOutlineIdentification,
  HiOutlineDocumentText,
  HiOutlinePhotograph
} from 'react-icons/hi';
import { FaStore, FaCrown, FaUserTie } from 'react-icons/fa';

const UserManagement = () => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    verified: 'all',
    sort: 'newest',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    clients: 0,
    sellers: 0,
    admins: 0,
    active: 0,
    blocked: 0,
    verified: 0,
    pendingVerification: 0
  });
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    phoneNumber: '',
    isActive: true,
    emailVerified: false,
    sellerDetails: {
      storeName: '',
      storeDescription: '',
      verificationStatus: 'pending',
      commission: 10
    }
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', { params: filters });
      setUsers(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showNotification('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/users/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, userForm);
        showNotification('success', 'User updated successfully');
      } else {
        await api.post('/admin/users', userForm);
        showNotification('success', 'User created successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'client',
        phoneNumber: '',
        isActive: true,
        emailVerified: false,
        sellerDetails: {
          storeName: '',
          storeDescription: '',
          verificationStatus: 'pending',
          commission: 10
        }
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      showNotification('error', `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { 
        isActive: !currentStatus 
      });
      setUsers(users.map(u =>
        u._id === userId ? { ...u, isActive: !currentStatus } : u
      ));
      showNotification('success', `User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to update user status');
    }
  };

  const handleToggleVerified = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { 
        emailVerified: !currentStatus 
      });
      setUsers(users.map(u =>
        u._id === userId ? { ...u, emailVerified: !currentStatus } : u
      ));
      showNotification('success', `Email verification ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (error) {
      showNotification('error', 'Failed to update verification status');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u =>
        u._id === userId ? { ...u, role: newRole } : u
      ));
      showNotification('success', `User role updated to ${newRole}`);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to update user role');
    }
  };

  const handleVerifySeller = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}`, {
        'sellerDetails.verificationStatus': status
      });
      setUsers(users.map(u =>
        u._id === userId 
          ? { ...u, sellerDetails: { ...u.sellerDetails, verificationStatus: status } }
          : u
      ));
      showNotification('success', `Seller ${status}`);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to update seller status');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${userToDelete}`);
      setUsers(users.filter(u => u._id !== userToDelete));
      showNotification('success', 'User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchStats();
    } catch (error) {
      showNotification('error', 'Failed to delete user');
    }
  };

  const handleExportUsers = () => {
    const data = users.map(u => ({
      'Name': u.name,
      'Email': u.email,
      'Role': u.role,
      'Status': u.isActive ? 'Active' : 'Inactive',
      'Verified': u.emailVerified ? 'Yes' : 'No',
      'Phone': u.phoneNumber || 'N/A',
      'Joined': new Date(u.createdAt).toLocaleDateString(),
      'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
      'Orders': u.totalOrders || 0,
      'Spent': u.totalSpent || 0
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <FaCrown className="w-4 h-4 text-yellow-500" />;
      case 'seller': return <FaStore className="w-4 h-4 text-blue-500" />;
      default: return <HiOutlineUser className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">Admin</span>;
      case 'seller': return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Seller</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Client</span>;
    }
  };

  const getVerificationBadge = (user) => {
    if (user.role === 'seller') {
      switch(user.sellerDetails?.verificationStatus) {
        case 'verified': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">Verified Seller</span>;
        case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">Pending</span>;
        case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Rejected</span>;
        default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Not Verified</span>;
      }
    }
    return user.emailVerified 
      ? <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">Verified</span>
      : <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">Unverified</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  if (loading && users.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage and moderate all users on the platform</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Clients</p>
            <p className="text-xl font-bold text-blue-600">{stats.clients}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Sellers</p>
            <p className="text-xl font-bold text-green-600">{stats.sellers}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Admins</p>
            <p className="text-xl font-bold text-purple-600">{stats.admins}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Blocked</p>
            <p className="text-xl font-bold text-red-600">{stats.blocked}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Verified</p>
            <p className="text-xl font-bold text-green-600">{stats.verified}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pendingVerification}</p>
          </motion.div>
        </motion.div>

        {/* Filters and Actions */}
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
                placeholder="Search by name, email, phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
            </select>

            <button
              onClick={fetchUsers}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <HiOutlineRefresh className="w-5 h-5" />
            </button>

            <button
              onClick={handleExportUsers}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export to CSV"
            >
              <HiOutlineDownload className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'client',
                  phoneNumber: '',
                  isActive: true,
                  emailVerified: false,
                  sellerDetails: {
                    storeName: '',
                    storeDescription: '',
                    verificationStatus: 'pending',
                    commission: 10
                  }
                });
                setShowUserModal(true);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
            >
              <HiOutlineUserAdd className="mr-2" />
              Add User
            </button>
          </div>
        </motion.div>

        {/* Users Table */}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Verification</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Last Login</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <motion.tr
                    key={user._id}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePicture || '/default-avatar.png'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{user.name}</p>
                            {getRoleIcon(user.role)}
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phoneNumber && (
                            <p className="text-xs text-gray-400">{user.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <>
                            <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <HiOutlineXCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getVerificationBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs flex items-center">
                          <HiOutlineShoppingBag className="mr-1" /> {user.totalOrders || 0} orders
                        </p>
                        <p className="text-xs flex items-center">
                          <HiOutlineCurrencyDollar className="mr-1" /> {formatCurrency(user.totalSpent || 0)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'seller' && user.sellerDetails?.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifySeller(user._id, 'verified')}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                              title="Approve Seller"
                            >
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifySeller(user._id, 'rejected')}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                              title="Reject Seller"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleToggleVerified(user._id, user.emailVerified)}
                          className={`p-2 rounded-lg ${
                            user.emailVerified
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                          title={user.emailVerified ? 'Mark Unverified' : 'Mark Verified'}
                        >
                          {user.emailVerified ? (
                            <HiOutlineMailOpen className="w-4 h-4" />
                          ) : (
                            <HiOutlineMail className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`p-2 rounded-lg ${
                            user.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <HiOutlineCheckCircle className="w-4 h-4" />
                          ) : (
                            <HiOutlineBan className="w-4 h-4" />
                          )}
                        </button>

                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="client">Client</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({
                              name: user.name,
                              email: user.email,
                              password: '',
                              role: user.role,
                              phoneNumber: user.phoneNumber || '',
                              isActive: user.isActive,
                              emailVerified: user.emailVerified,
                              sellerDetails: user.sellerDetails || {
                                storeName: '',
                                storeDescription: '',
                                verificationStatus: 'pending',
                                commission: 10
                              }
                            });
                            setShowUserModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setUserToDelete(user._id);
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
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalUsers)} of {totalUsers} users
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

        {/* Add/Edit User Modal */}
        <AnimatePresence>
          {showUserModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={() => setShowUserModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required={!editingUser}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userForm.phoneNumber}
                      onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="client">Client</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {userForm.role === 'seller' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={userForm.sellerDetails.storeName}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            sellerDetails: { ...userForm.sellerDetails, storeName: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Description
                        </label>
                        <textarea
                          value={userForm.sellerDetails.storeDescription}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            sellerDetails: { ...userForm.sellerDetails, storeDescription: e.target.value }
                          })}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seller Verification
                        </label>
                        <select
                          value={userForm.sellerDetails.verificationStatus}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            sellerDetails: { ...userForm.sellerDetails, verificationStatus: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Commission Rate (%)
                        </label>
                        <input
                          type="number"
                          value={userForm.sellerDetails.commission}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            sellerDetails: { ...userForm.sellerDetails, commission: parseInt(e.target.value) }
                          })}
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userForm.isActive}
                        onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userForm.emailVerified}
                        onChange={(e) => setUserForm({ ...userForm, emailVerified: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Email Verified</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 btn-primary"
                  >
                    {editingUser ? 'Update' : 'Create'} User
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
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
                <h3 className="text-xl font-bold text-gray-800 mb-4">Delete User</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteUser}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
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
      </div>
    </div>
  );
};

export default UserManagement;