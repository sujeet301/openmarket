import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';  // ✅ Add this import
import WishlistPage from './pages/WishlistPage';  // ✅ Add this import
import SellerDashboard from './components/seller/SellerDashboard';
import SellerProducts from './components/seller/SellerProducts';
import AddProduct from './components/seller/AddProduct';
import SellerOrders from './components/seller/SellerOrders';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ProductManagement from './components/admin/ProductManagement';
import OrderManagement from './components/admin/OrderManagement';
import PrivateRoute from './components/auth/PrivateRoute';
import SellerRoute from './components/auth/SellerRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      
                      {/* Protected Routes - Any authenticated user */}
                      <Route element={<PrivateRoute
                        allowedRoles={['premium']}
                        redirectTo="/premium-signup"
                        fallbackPath="/pricing"
                        sessionTimeout={15 * 60 * 1000} // 15 minutes
                      />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                      </Route>

                      {/* Seller Routes */}
                      <Route element={<SellerRoute />}>
                        <Route path="/seller/dashboard" element={<SellerDashboard />} />
                        <Route path="/seller/products" element={<SellerProducts />} />
                        <Route path="/seller/add-product" element={<AddProduct />} />
                        <Route path="/seller/products/edit/:id" element={<AddProduct />} />
                        <Route path="/seller/orders" element={<SellerOrders />} />
                      </Route>

                      {/* Admin Routes */}
                      <Route element={<AdminRoute />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<UserManagement />} />
                        <Route path="/admin/products" element={<ProductManagement />} />
                        <Route path="/admin/orders" element={<OrderManagement />} />
                      </Route>

                      {/* 404 Redirect */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </NotificationProvider>
  );
}

export default App;