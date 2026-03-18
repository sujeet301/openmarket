import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineGift,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineChevronUp
} from 'react-icons/hi';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaPinterest,
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex, 
  FaCcPaypal, 
  FaApplePay, 
  FaGooglePay 
} from 'react-icons/fa';

const Footer = () => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      showNotification('success', 'Thank you for subscribing to our newsletter!');
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const socialIconVariants = {
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.9
    }
  };

  const paymentIconVariants = {
    hover: {
      y: -3,
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white relative">
      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={showScrollTop ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <HiOutlineChevronUp className="w-5 h-5" />
      </motion.button>

      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-3">Stay in the Loop</h2>
            <p className="text-gray-400 mb-6">
              Subscribe to our newsletter for exclusive deals, new arrivals, and special offers!
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                Subscribe
                <HiOutlineArrowRight className="ml-2" />
              </motion.button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center"
              >
                <span className="text-white font-bold text-xl">OM</span>
              </motion.div>
              <span className="text-2xl font-bold text-white">OpenMarket</span>
            </Link>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              Your one-stop destination for everything. From electronics to fashion, 
              we bring the best products right to your doorstep.
            </p>

            <div className="space-y-2">
              <div className="flex items-center text-gray-400">
                <HiOutlineLocationMarker className="w-5 h-5 mr-3 text-primary-500" />
                <span className="text-sm">123 Market Street, New York, NY 10001</span>
              </div>
              <div className="flex items-center text-gray-400">
                <HiOutlinePhone className="w-5 h-5 mr-3 text-primary-500" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400">
                <HiOutlineMail className="w-5 h-5 mr-3 text-primary-500" />
                <span className="text-sm">support@openmarket.com</span>
              </div>
            </div>

            {/* Social Media - Using Fa icons instead of HiOutline */}
            <div className="flex space-x-3 pt-4">
              {[
                { icon: FaFacebook, link: 'https://facebook.com', label: 'Facebook', color: 'hover:text-blue-600' },
                { icon: FaTwitter, link: 'https://twitter.com', label: 'Twitter', color: 'hover:text-blue-400' },
                { icon: FaInstagram, link: 'https://instagram.com', label: 'Instagram', color: 'hover:text-pink-600' },
                { icon: FaYoutube, link: 'https://youtube.com', label: 'YouTube', color: 'hover:text-red-600' },
                { icon: FaLinkedin, link: 'https://linkedin.com', label: 'LinkedIn', color: 'hover:text-blue-700' },
                { icon: FaPinterest, link: 'https://pinterest.com', label: 'Pinterest', color: 'hover:text-red-700' }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={socialIconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center transition-colors ${social.color}`}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-400 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'About Us', link: '/about' },
                { name: 'Contact Us', link: '/contact' },
                { name: 'FAQs', link: '/faqs' },
                { name: 'Shipping Info', link: '/shipping' },
                { name: 'Returns Policy', link: '/returns' },
                { name: 'Track Order', link: '/track-order' }
              ].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    to={item.link}
                    className="text-gray-400 hover:text-primary-500 transition-colors text-sm flex items-center"
                  >
                    <HiOutlineArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100" />
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Categories */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Shop by Category</h3>
            <ul className="space-y-2">
              {[
                { name: 'Electronics', link: '/category/electronics' },
                { name: 'Fashion', link: '/category/fashion' },
                { name: 'Home & Living', link: '/category/home' },
                { name: 'Beauty', link: '/category/beauty' },
                { name: 'Sports', link: '/category/sports' },
                { name: 'Books', link: '/category/books' }
              ].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    to={item.link}
                    className="text-gray-400 hover:text-primary-500 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Customer Service</h3>
            <ul className="space-y-2">
              {[
                { name: 'My Account', link: '/profile' },
                { name: 'Order History', link: '/orders' },
                { name: 'Wishlist', link: '/wishlist' },
                { name: 'Gift Cards', link: '/gift-cards' },
                { name: 'Privacy Policy', link: '/privacy' },
                { name: 'Terms of Service', link: '/terms' }
              ].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    to={item.link}
                    className="text-gray-400 hover:text-primary-500 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>

            {/* App Download Buttons */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Download Our App</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div>
                    <div className="text-xs">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </motion.a>
                
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.84.27 1.19 0 .34-.27.34-.71 0-.98l-1.19-.92-1.19.92c-.34.27-.34.71 0 .98.34.27.84.27 1.19 0l1.19-.92 1.19.92c.34.27.84.27 1.19 0 .34-.27.34-.71 0-.98L19.5 10l1.19-.92c.34-.27.34-.71 0-.98-.34-.27-.84-.27-1.19 0L18.5 9.08l-1.19-.92c-.34-.27-.84-.27-1.19 0-.34.27-.34.71 0 .98l1.19.92-1.19.92c-.34.27-.34.71 0 .98.34.27.84.27 1.19 0l1.19-.92 1.19.92zM6.05 2.66l8.49 8.49-2.27 2.27-8.49-8.49c.5-.24.84-.76.84-1.35 0-.59-.34-1.11-.84-1.35z" />
                  </svg>
                  <div>
                    <div className="text-xs">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm text-gray-400"
            >
              © {new Date().getFullYear()} OpenMarket. All rights reserved.
            </motion.p>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center text-gray-400">
                <HiOutlineShieldCheck className="w-4 h-4 mr-1 text-primary-500" />
                <span className="text-xs">Secure SSL</span>
              </div>
              <div className="flex items-center text-gray-400">
                <HiOutlineTruck className="w-4 h-4 mr-1 text-primary-500" />
                <span className="text-xs">Free Shipping</span>
              </div>
              <div className="flex items-center text-gray-400">
                <HiOutlineRefresh className="w-4 h-4 mr-1 text-primary-500" />
                <span className="text-xs">30-Day Returns</span>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3"
            >
              <span className="text-xs text-gray-500 mr-2">We Accept:</span>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaCcVisa className="w-8 h-8 text-gray-500 hover:text-blue-500 transition-colors" />
              </motion.div>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaCcMastercard className="w-8 h-8 text-gray-500 hover:text-yellow-500 transition-colors" />
              </motion.div>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaCcAmex className="w-8 h-8 text-gray-500 hover:text-blue-400 transition-colors" />
              </motion.div>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaCcPaypal className="w-8 h-8 text-gray-500 hover:text-blue-600 transition-colors" />
              </motion.div>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaApplePay className="w-8 h-8 text-gray-500 hover:text-black transition-colors" />
              </motion.div>
              <motion.div variants={paymentIconVariants} whileHover="hover">
                <FaGooglePay className="w-8 h-8 text-gray-500 hover:text-blue-500 transition-colors" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Made with Love */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gray-950 py-3"
      >
        <div className="container-custom text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center">
            Made with
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="mx-1"
            >
              <HiOutlineHeart className="w-4 h-4 text-red-500" />
            </motion.span>
            by OpenMarket Team
          </p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;