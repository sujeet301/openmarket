import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
  
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const { user, isAuthenticated } = useAuth();

  // Load wishlist from localStorage or API
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      // Load from localStorage for guest users
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    }
  }, [isAuthenticated, user]);

  // Save to localStorage whenever wishlist changes (for guest users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/wishlist');
      setWishlist(response.data.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    try {
      if (isAuthenticated) {
        await api.post(`/users/wishlist/${product._id}`);
      }
      
      setWishlist(prev => {
        // Check if product already exists
        if (prev.some(item => item._id === product._id)) {
          return prev;
        }
        return [...prev, product];
      });
      
      showNotification('success', `${product.name} added to wishlist`);
    } catch (error) {
      showNotification('error', 'Failed to add to wishlist');
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      if (isAuthenticated) {
        await api.delete(`/users/wishlist/${productId}`);
      }
      
      setWishlist(prev => prev.filter(item => item._id !== productId));
      showNotification('success', 'Item removed from wishlist');
    } catch (error) {
      showNotification('error', 'Failed to remove from wishlist');
      console.error('Error removing from wishlist:', error);
    }
  };

  const toggleWishlist = (product) => {
    const isInWishlist = wishlist.some(item => item._id === product._id);
    
    if (isInWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  const clearWishlist = async () => {
    try {
      if (isAuthenticated) {
        // You might want to create a bulk delete endpoint
        for (const item of wishlist) {
          await api.delete(`/users/wishlist/${item._id}`);
        }
      }
      
      setWishlist([]);
      showNotification('success', 'Wishlist cleared');
    } catch (error) {
      showNotification('error', 'Failed to clear wishlist');
    }
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlist.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};