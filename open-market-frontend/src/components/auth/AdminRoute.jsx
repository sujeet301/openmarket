import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';
import {
  // Solid icons (all valid)
  HiShieldCheck,
  HiExclamationCircle,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiCog,
  HiUserGroup,
  HiShoppingBag,
  HiCurrencyDollar,
  HiChartBar,
  HiStar,
  HiRefresh,
  HiArrowRight,
  HiHome,
  HiPhone,
  HiMail,
  HiChat,
  HiDatabase,
  HiServer,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiBan,
  HiTrash,
  HiPencil,
  HiPlus,
  HiSearch,
  HiFilter,
  HiDownload,
  HiUpload,
  HiPrinter,
  HiUserCircle,
  HiUserAdd,
  HiUserRemove,
  HiShieldExclamation,
  HiTemplate,
  HiColorSwatch,
  HiPhotograph,
  HiDocumentText,
  HiDocumentReport,
  HiChartPie,
  HiChartSquareBar,
  HiTrendingUp,
  HiTrendingDown,
  HiCash,
  HiCreditCard,
  HiGift,           // ✅ Valid
  HiFire,           // ✅ Valid (use instead of HiTrophy)
  HiSparkles,       // ✅ Valid
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
  HiDeviceTablet,   // ✅ Valid (use instead of HiTablet)
  HiCalendar,
  
  // Valid outline icons
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineBan,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlinePrinter,
  HiOutlineUserCircle,
  HiOutlineUserAdd,
  HiOutlineUserRemove
} from 'react-icons/hi';
import { FaCrown, FaRegGem, FaDragon } from 'react-icons/fa';
import { RiAdminFill, RiAdminLine, RiShieldStarFill, RiShieldStarLine } from 'react-icons/ri';

const AdminRoute = ({
  requiredPermissions = [],
  requireSuperAdmin = false,
  minAdminLevel = 1,
  redirectTo = '/login',
  fallbackPath = '/',
  showSystemHealth = true,
  enableAuditLog = true,
  sessionMonitoring = true
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const location = useLocation();
  
  const [adminLevel, setAdminLevel] = useState(1);
  const [adminPermissions, setAdminPermissions] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAdminData();
      if (sessionMonitoring) {
        startSessionMonitoring();
      }
    }
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    try {
      const response = await api.get('/admin/status');
      setAdminLevel(response.data.data.adminLevel);
      setAdminPermissions(response.data.data.permissions);
      
      if (showSystemHealth) {
        const healthResponse = await api.get('/admin/system-health');
        setSystemHealth(healthResponse.data.data);
      }

      const securityResponse = await api.get('/admin/security-alerts');
      setSecurityAlerts(securityResponse.data.data);

      const activitiesResponse = await api.get('/admin/recent-activities');
      setRecentActivities(activitiesResponse.data.data);

      const attemptsResponse = await api.get('/admin/login-attempts');
      setLoginAttempts(attemptsResponse.data.data);

      const suspiciousResponse = await api.get('/admin/suspicious-activities');
      setSuspiciousActivities(suspiciousResponse.data.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const startSessionMonitoring = () => {
    const checkInterval = setInterval(() => {
      api.get('/admin/active-sessions')
        .then(response => {
          if (response.data.data.concurrentSessions > 1) {
            showNotification(
              'warning',
              `Warning: ${response.data.data.concurrentSessions} active admin sessions detected`,
              10000
            );
          }
        })
        .catch(console.error);
    }, 60000);

    return () => clearInterval(checkInterval);
  };

  const handleSecurityAlert = async (alertId, action) => {
    try {
      await api.post(`/admin/security-alerts/${alertId}/${action}`);
      showNotification('success', `Alert ${action}ed successfully`);
      fetchAdminData();
    } catch (error) {
      showNotification('error', 'Failed to process alert');
    }
  };

  const handleSystemAction = async (action) => {
    try {
      await api.post(`/admin/system/${action}`);
      showNotification('success', `System ${action} initiated`);
    } catch (error) {
      showNotification('error', `Failed to ${action} system`);
    }
  };

  const handleAuditLog = async (action) => {
    try {
      const response = await api.get(`/admin/audit-logs?action=${action}`);
      setRecentActivities(response.data.data);
    } catch (error) {
      showNotification('error', 'Failed to fetch audit logs');
    }
  };

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md border border-gray-700"
        >
          <div className="relative">
            <LoadingSpinner />
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <RiAdminFill className="text-primary-400 text-3xl" />
            </motion.div>
          </div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xl font-semibold text-white"
          >
            Verifying Admin Credentials
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-sm text-gray-400"
          >
            Scanning security protocols and permissions...
          </motion.p>

          <div className="mt-6 space-y-2">
            {[
              'Authentication check',
              'Permission verification',
              'Security audit',
              'System health check'
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center text-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"
                />
                <span className="text-gray-300">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Please login with admin credentials',
          intendedRole: 'admin'
        }} 
        replace 
      />
    );
  }

  if (user?.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-gray-900 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
        >
          <div className="bg-gradient-to-r from-red-800 to-red-900 p-8 text-center relative overflow-hidden">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-block"
            >
              <HiShieldExclamation className="text-white text-7xl mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mt-4">Access Denied</h2>
            <p className="text-red-200 mt-2">This area is restricted to administrators only</p>
            
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-10 right-10 w-20 h-20 bg-white opacity-5 rounded-full"
            />
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute bottom-10 left-10 w-32 h-32 bg-white opacity-5 rounded-full"
            />
          </div>

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-red-900 bg-opacity-20 rounded-full px-4 py-2 mb-4">
                <span className="text-red-400 font-mono">403 FORBIDDEN</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                You don't have administrator privileges
              </h3>
              <p className="text-gray-400">
                Your account ({user?.email}) does not have the required permissions to access this area.
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <HiUserCircle className="mr-2 text-blue-400" />
                Account Details:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white font-mono">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Permissions Level:</span>
                  <span className="text-yellow-400 font-mono">Standard User</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Admin Access:</span>
                  <span className="text-red-400 font-mono">None</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-white mb-3">Required Admin Levels:</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <div 
                    key={level}
                    className={`
                      text-center p-2 rounded
                      ${level <= minAdminLevel 
                        ? 'bg-primary-600 bg-opacity-20 border border-primary-500' 
                        : 'bg-gray-600 bg-opacity-20 border border-gray-600'
                      }
                    `}
                  >
                    <span className={`text-sm ${level <= minAdminLevel ? 'text-primary-400' : 'text-gray-500'}`}>
                      Level {level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Link to={fallbackPath} className="block w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <HiHome className="mr-2" />
                  Return to Homepage
                </motion.button>
              </Link>
              
              <Link to="/contact-support" className="block w-full">
                <button className="w-full border-2 border-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                  Contact Administrator
                </button>
              </Link>
            </div>

            <p className="text-xs text-center text-gray-500 mt-6">
              This attempt has been logged. Unauthorized access attempts are monitored.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (requireSuperAdmin && adminLevel < 5) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
        >
          <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-6 text-center">
            <FaCrown className="text-yellow-400 text-6xl mx-auto" />
            <h2 className="text-2xl font-bold text-white mt-2">Super Admin Required</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-300 mb-4">
              This area requires Super Admin privileges (Level 5). Your current admin level is {adminLevel}.
            </p>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-white mb-3">Admin Level Progress:</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Level:</span>
                  <span className="text-yellow-400 font-bold">Level {adminLevel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Required Level:</span>
                  <span className="text-purple-400 font-bold">Level 5</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(adminLevel / 5) * 100}%` }}
                    className="bg-gradient-to-r from-yellow-500 to-purple-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(
      perm => !adminPermissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 to-red-900 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
          >
            <div className="bg-gradient-to-r from-orange-800 to-red-800 p-6 text-center">
              <HiShieldExclamation className="text-white text-6xl mx-auto" />
              <h2 className="text-2xl font-bold text-white mt-2">Insufficient Permissions</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">
                You don't have the required permissions to access this section.
              </p>

              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-white mb-3">Missing Permissions:</h4>
                <ul className="space-y-2">
                  {missingPermissions.map((perm, index) => (
                    <motion.li
                      key={perm}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center text-sm text-red-400"
                    >
                      <HiXCircle className="mr-2" />
                      {perm.replace(/_/g, ' ')}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-white mb-3">Your Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {adminPermissions.map(perm => (
                    <span 
                      key={perm}
                      className="px-2 py-1 bg-green-900 bg-opacity-30 text-green-400 rounded text-xs border border-green-800"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.history.back()}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </motion.div>
      );
    }
  }

  return (
    <>
      <AdminContext.Provider 
        value={{ 
          adminLevel, 
          adminPermissions, 
          systemHealth,
          securityAlerts,
          recentActivities,
          loginAttempts,
          suspiciousActivities,
          refreshAdminData: fetchAdminData
        }}
      >
        <Outlet />
      </AdminContext.Provider>

      <AnimatePresence>
        {showSecurityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowSecurityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-800 to-red-900 p-4 sticky top-0">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <HiShieldExclamation className="mr-2" />
                  Security Dashboard
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Active Security Alerts</h4>
                  <div className="space-y-3">
                    {securityAlerts.map(alert => (
                      <div key={alert.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-red-400 font-mono text-sm">{alert.type}</span>
                          <span className="text-gray-400 text-xs">{alert.timestamp}</span>
                        </div>
                        <p className="text-white text-sm mb-2">{alert.message}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSecurityAlert(alert.id, 'resolve')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleSecurityAlert(alert.id, 'investigate')}
                            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                          >
                            Investigate
                          </button>
                          <button
                            onClick={() => handleSecurityAlert(alert.id, 'ignore')}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Recent Login Attempts</h4>
                  <div className="space-y-2">
                    {loginAttempts.slice(0, 5).map(attempt => (
                      <div key={attempt.id} className="flex items-center justify-between text-sm bg-gray-700 p-2 rounded">
                        <span className="text-gray-300">{attempt.email}</span>
                        <span className={`${attempt.success ? 'text-green-400' : 'text-red-400'}`}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-gray-400 text-xs">{attempt.ip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Suspicious Activities</h4>
                  <div className="space-y-2">
                    {suspiciousActivities.map(activity => (
                      <div key={activity.id} className="bg-gray-700 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="text-yellow-400 text-sm">{activity.type}</span>
                          <span className="text-gray-400 text-xs">{activity.time}</span>
                        </div>
                        <p className="text-gray-300 text-xs mt-1">{activity.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowHealthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl max-w-2xl w-full border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <HiServer className="mr-2" />
                  System Health Monitor
                </h3>
              </div>

              <div className="p-6">
                {systemHealth && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-sm text-gray-400">CPU Usage</div>
                        <div className="text-xl text-white">{systemHealth.cpu}%</div>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-sm text-gray-400">Memory</div>
                        <div className="text-xl text-white">{systemHealth.memory}%</div>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-sm text-gray-400">Disk</div>
                        <div className="text-xl text-white">{systemHealth.disk}%</div>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-sm text-gray-400">Uptime</div>
                        <div className="text-xl text-white">{systemHealth.uptime}</div>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded">
                      <h4 className="text-white font-semibold mb-2">Database</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Connection Pool:</span>
                          <span className="text-green-400">{systemHealth.db.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Query Time:</span>
                          <span className="text-yellow-400">{systemHealth.db.queryTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-blue-400">{systemHealth.db.size}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-2">Services</h4>
                      <div className="space-y-2">
                        {Object.entries(systemHealth.services).map(([service, status]) => (
                          <div key={service} className="flex items-center justify-between">
                            <span className="text-gray-300">{service}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              status === 'healthy' ? 'bg-green-900 text-green-400' :
                              status === 'degraded' ? 'bg-yellow-900 text-yellow-400' :
                              'bg-red-900 text-red-400'
                            }`}>
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button
                        onClick={() => handleSystemAction('restart')}
                        className="bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
                      >
                        Restart Services
                      </button>
                      <button
                        onClick={() => handleSystemAction('backup')}
                        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                      >
                        Create Backup
                      </button>
                      <button
                        onClick={() => handleSystemAction('clear-cache')}
                        className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                      >
                        Clear Cache
                      </button>
                      <button
                        onClick={() => handleSystemAction('optimize')}
                        className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Optimize DB
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAuditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-800 to-purple-900 p-4 sticky top-0">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <HiDocumentText className="mr-2" />
                  Audit Log
                </h3>
              </div>

              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <select className="bg-gray-700 text-white rounded px-3 py-1 text-sm">
                    <option>All Actions</option>
                    <option>User Management</option>
                    <option>Product Management</option>
                    <option>Order Management</option>
                    <option>System Settings</option>
                  </select>
                  <select className="bg-gray-700 text-white rounded px-3 py-1 text-sm">
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Custom Range</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search logs..."
                    className="bg-gray-700 text-white rounded px-3 py-1 text-sm flex-1"
                  />
                  <button className="bg-primary-600 text-white px-3 py-1 rounded text-sm">
                    <HiDownload />
                  </button>
                </div>

                <div className="space-y-2">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-700 p-3 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-mono text-primary-400">{activity.action}</span>
                          <p className="text-white text-sm mt-1">{activity.details}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <span className="mr-3">User: {activity.user}</span>
                            <span className="mr-3">IP: {activity.ip}</span>
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          activity.status === 'success' ? 'bg-green-900 text-green-400' :
                          activity.status === 'failed' ? 'bg-red-900 text-red-400' :
                          'bg-yellow-900 text-yellow-400'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button className="text-gray-400 hover:text-white">Previous</button>
                  <span className="text-white text-sm">Page 1 of 10</span>
                  <button className="text-gray-400 hover:text-white">Next</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed right-6 top-24 z-50 flex flex-col gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSecurityModal(true)}
          className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl relative"
        >
          <HiShieldExclamation className="text-xl" />
          {securityAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {securityAlerts.length}
            </span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowHealthModal(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl"
        >
          <HiServer className="text-xl" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAuditModal(true)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl"
        >
          <HiDocumentText className="text-xl" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-primary-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl"
          onClick={() => showNotification('info', 'Admin quick actions menu')}
        >
          <HiCog className="text-xl" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-lg z-40"
      >
        <div className="container-custom py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="flex items-center text-gray-300">
                <RiAdminFill className="text-primary-400 mr-1" />
                Admin Level {adminLevel}
              </span>
              <span className="flex items-center text-gray-300">
                <HiShieldCheck className="text-green-400 mr-1" />
                {adminPermissions.length} Permissions
              </span>
              {systemHealth && (
                <>
                  <span className="flex items-center text-gray-300">
                    <HiServer className="text-blue-400 mr-1" />
                    CPU: {systemHealth.cpu}%
                  </span>
                  <span className="flex items-center text-gray-300">
                    <HiDatabase className="text-purple-400 mr-1" />
                    DB: {systemHealth.db.connections} conn
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => handleSystemAction('refresh')}
                className="text-gray-400 hover:text-white"
              >
                <HiRefresh />
              </button>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const AdminContext = React.createContext(null);
export const useAdmin = () => {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminRoute');
  }
  return context;
};

export const SuperAdminRoute = (props) => (
  <AdminRoute {...props} requireSuperAdmin={true} minAdminLevel={5} />
);

export const SystemAdminRoute = (props) => (
  <AdminRoute 
    {...props} 
    requiredPermissions={['system:manage', 'users:manage', 'settings:manage']}
    minAdminLevel={4}
  />
);

export const UserAdminRoute = (props) => (
  <AdminRoute 
    {...props} 
    requiredPermissions={['users:manage', 'users:view', 'users:moderate']}
    minAdminLevel={2}
  />
);

export const ProductAdminRoute = (props) => (
  <AdminRoute 
    {...props} 
    requiredPermissions={['products:manage', 'products:approve', 'categories:manage']}
    minAdminLevel={2}
  />
);

export const OrderAdminRoute = (props) => (
  <AdminRoute 
    {...props} 
    requiredPermissions={['orders:manage', 'orders:refund', 'payments:manage']}
    minAdminLevel={2}
  />
);

export const AdminStatsWidget = () => {
  const { systemHealth, securityAlerts, recentActivities } = useAdmin();
  
  return (
    <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
      <h3 className="font-semibold text-white mb-3 flex items-center">
        <HiChartBar className="mr-2 text-primary-400" />
        System Overview
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">Active Alerts</p>
          <p className="text-xl font-bold text-red-400">{securityAlerts.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Today's Actions</p>
          <p className="text-xl font-bold text-green-400">
            {recentActivities?.filter(a => 
              a && new Date(a.timestamp).toDateString() === new Date().toDateString()
            ).length || 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">System Load</p>
          <p className="text-xl font-bold text-yellow-400">{systemHealth?.cpu || 0}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Active Users</p>
          <p className="text-xl font-bold text-blue-400">{systemHealth?.activeUsers || 0}</p>
        </div>
      </div>
    </div>
  );
};

export const RequirePermission = ({ permission, children, fallback = null }) => {
  const { adminPermissions } = useAdmin();
  
  if (!adminPermissions?.includes(permission)) {
    return fallback;
  }
  
  return children;
};

export default AdminRoute;