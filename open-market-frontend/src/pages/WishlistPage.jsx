import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingBag, HiOutlineTrash } from 'react-icons/hi';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    // Optional: remove from wishlist after adding to cart
    // removeFromWishlist(product._id);
  };

  if (wishlist.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="text-center">
          <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
            <HiOutlineHeart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-600 mb-6">Save your favorite items here!</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Wishlist ({wishlist.length})</h1>
        <button
          onClick={clearWishlist}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Clear Wishlist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <Link to={`/product/${product._id}`}>
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </Link>

            <div className="p-4">
              <Link to={`/product/${product._id}`}>
                <h3 className="font-semibold text-gray-800 hover:text-primary-600 mb-2">
                  {product.name}
                </h3>
              </Link>

              <p className="text-lg font-bold text-primary-600 mb-3">
                ${product.price}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center"
                >
                  <HiOutlineShoppingBag className="mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  title="Remove from wishlist"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;