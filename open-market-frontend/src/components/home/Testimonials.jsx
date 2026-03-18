import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiOutlineStar, 
  HiStar, 
  HiOutlineHeart, 
  HiHeart,
  HiOutlineChat,
  HiOutlineShare,
  HiOutlineCheckCircle,
  HiOutlineEmojiHappy,
  HiOutlineEmojiSad,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlineThumbUp,
  HiOutlineThumbDown,
  HiOutlineFlag,
  HiOutlinePhotograph,
  HiOutlineVideoCamera
} from 'react-icons/hi';
import { FaQuoteLeft, FaQuoteRight, FaTwitter, FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { BsThreeDots, BsBookmark, BsBookmarkFill } from 'react-icons/bs';

// Helper component for neutral emoji (since it's not exported)
const HiOutlineEmojiNeutral = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z"
      clipRule="evenodd"
    />
  </svg>
);

const Testimonials = ({
  testimonials = [],
  title = "What Our Customers Say",
  subtitle = "Join thousands of satisfied customers who trust us",
  variant = "grid", // grid, carousel, masonry, cards, minimal, featured
  layout = "grid", // grid, slider, masonry, carousel
  columns = 3,
  autoplay = false,
  autoplaySpeed = 5000,
  showArrows = true,
  showDots = true,
  showRatings = true,
  showMedia = true,
  showVerified = true,
  showSocial = true,
  showHelpful = true,
  allowInteractions = true,
  darkMode = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [likedTestimonials, setLikedTestimonials] = useState([]);
  const [bookmarkedTestimonials, setBookmarkedTestimonials] = useState([]);
  const [expandedTestimonials, setExpandedTestimonials] = useState([]);
  const [hoveredTestimonial, setHoveredTestimonial] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplay);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  // Default testimonials if none provided
  const defaultTestimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Verified Buyer",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      content: "Absolutely love my purchase! The quality exceeded my expectations and shipping was incredibly fast. Will definitely be shopping here again.",
      date: "2024-02-15",
      verified: true,
      helpful: 45,
      purchased: ["Wireless Headphones", "Phone Case"],
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150"
      ],
      social: {
        twitter: "@sarahj",
        instagram: "@sarah.j"
      }
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Tech Enthusiast",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
      content: "The customer service is outstanding! Had an issue with my order and they resolved it within hours. The product itself is top-notch.",
      date: "2024-02-10",
      verified: true,
      helpful: 32,
      purchased: ["Smart Watch", "Laptop Stand"],
      images: [
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150"
      ]
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Fashion Blogger",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 4,
      content: "Great selection of products and amazing prices. The website is easy to navigate and checkout was a breeze. Highly recommended!",
      date: "2024-02-05",
      verified: true,
      helpful: 28,
      purchased: ["Designer Bag", "Sunglasses", "Scarf"],
      images: [
        "https://images.unsplash.com/photo-1584917865442-5c2b4d2c4b4a?w=150",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=150",
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=150"
      ],
      video: "https://example.com/review.mp4"
    },
    {
      id: 4,
      name: "David Kim",
      role: "Professional Gamer",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      rating: 5,
      content: "Best gaming accessories I've ever used! The mechanical keyboard is a game-changer. My K/D ratio has improved significantly!",
      date: "2024-01-28",
      verified: true,
      helpful: 67,
      purchased: ["Gaming Keyboard", "Gaming Mouse", "Headset"]
    },
    {
      id: 5,
      name: "Lisa Thompson",
      role: "Home Decor Enthusiast",
      avatar: "https://randomuser.me/api/portraits/women/90.jpg",
      rating: 5,
      content: "The home decor items are beautiful and affordable. Transformed my living room completely. The quality is amazing for the price.",
      date: "2024-01-20",
      verified: true,
      helpful: 23,
      purchased: ["Wall Art", "Throw Pillows", "Vase"],
      images: [
        "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=150"
      ]
    },
    {
      id: 6,
      name: "James Wilson",
      role: "Fitness Coach",
      avatar: "https://randomuser.me/api/portraits/men/52.jpg",
      rating: 4,
      content: "Great fitness gear at reasonable prices. The yoga mat is thick and comfortable. Would love to see more variety in sizes though.",
      date: "2024-01-15",
      verified: true,
      helpful: 19,
      purchased: ["Yoga Mat", "Dumbbells", "Resistance Bands"]
    }
  ];

  const activeTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Filter testimonials by rating
  const filteredTestimonials = selectedFilter === 'all' 
    ? activeTestimonials 
    : activeTestimonials.filter(t => t.rating >= parseInt(selectedFilter));

  // Autoplay for carousel
  useEffect(() => {
    let interval;
    if (isAutoPlaying && variant === 'carousel') {
      interval = setInterval(() => {
        handleNext();
      }, autoplaySpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoplaySpeed, variant]);

  // Mouse move effect for 3D cards
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current && variant === 'cards') {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [variant]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => Math.min(activeTestimonials.length - 1, prev + 1));
    setIsAutoPlaying(false);
  };

  const handleLike = (id) => {
    setLikedTestimonials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBookmark = (id) => {
    setBookmarkedTestimonials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExpand = (id) => {
    setExpandedTestimonials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <motion.span
        key={index}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 }}
      >
        {index < rating ? (
          <HiStar className="w-5 h-5 text-yellow-400 fill-current" />
        ) : (
          <HiOutlineStar className="w-5 h-5 text-yellow-400" />
        )}
      </motion.span>
    ));
  };

  // Get sentiment emoji
  const getSentimentEmoji = (rating) => {
    if (rating >= 4) return <HiOutlineEmojiHappy className="w-6 h-6 text-green-500" />;
    if (rating === 3) return <HiOutlineEmojiNeutral className="w-6 h-6 text-yellow-500" />;
    return <HiOutlineEmojiSad className="w-6 h-6 text-red-500" />;
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

  const card3DVariants = {
    hover: (mousePosition) => ({
      rotateX: mousePosition.y * 20,
      rotateY: mousePosition.x * 20,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    })
  };

  const quoteVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };

  // Render different layout variants
  const renderGrid = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}
    >
      {filteredTestimonials.map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          variants={itemVariants}
          custom={index}
          whileHover={variant === 'cards' ? "hover" : undefined}
          variants={variant === 'cards' ? card3DVariants : undefined}
          onHoverStart={() => setHoveredTestimonial(testimonial.id)}
          onHoverEnd={() => setHoveredTestimonial(null)}
          className={`
            relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300
            ${darkMode ? 'bg-gray-800 text-white' : ''}
            ${hoveredTestimonial === testimonial.id ? 'shadow-2xl transform scale-[1.02]' : ''}
          `}
        >
          {/* Quote Icon */}
          <motion.div
            variants={quoteVariants}
            initial="initial"
            animate="animate"
            className={`absolute top-4 right-4 opacity-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            <FaQuoteRight className="w-12 h-12" />
          </motion.div>

          {/* Content */}
          <div className="p-6">
            {/* Rating */}
            {showRatings && (
              <div className="flex mb-4">
                {renderStars(testimonial.rating)}
                <span className="ml-2 text-sm text-gray-500">
                  ({testimonial.helpful} helpful)
                </span>
              </div>
            )}

            {/* Testimonial Content */}
            <div className="relative mb-4">
              <FaQuoteLeft className={`absolute -top-2 -left-2 w-4 h-4 opacity-30 ${darkMode ? 'text-white' : 'text-gray-400'}`} />
              <p className={`text-gray-700 ${darkMode ? 'text-gray-300' : ''} leading-relaxed pl-6`}>
                {expandedTestimonials.includes(testimonial.id) 
                  ? testimonial.content 
                  : `${testimonial.content.substring(0, 150)}...`}
              </p>
            </div>

            {/* Read More */}
            {testimonial.content.length > 150 && (
              <button
                onClick={() => handleExpand(testimonial.id)}
                className="text-primary-600 text-sm font-medium mb-4 hover:underline"
              >
                {expandedTestimonials.includes(testimonial.id) ? 'Show Less' : 'Read More'}
              </button>
            )}

            {/* Purchased Items */}
            {testimonial.purchased && (
              <div className="mb-4">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Purchased:
                </p>
                <div className="flex flex-wrap gap-2">
                  {testimonial.purchased.map((item, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Media Gallery */}
            {showMedia && testimonial.images && testimonial.images.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {testimonial.images.map((img, i) => (
                    <motion.img
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      src={img}
                      alt={`Review ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                    />
                  ))}
                  {testimonial.video && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                    >
                      <HiOutlineVideoCamera className="w-6 h-6 text-gray-600" />
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center mb-4">
              <div className="relative">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {testimonial.verified && showVerified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1"
                  >
                    <HiOutlineCheckCircle className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {testimonial.name}
                </h4>
                <div className="flex items-center text-sm">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {testimonial.role}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <HiOutlineClock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(testimonial.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            {allowInteractions && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(testimonial.id)}
                    className="flex items-center gap-1"
                  >
                    {likedTestimonials.includes(testimonial.id) ? (
                      <HiHeart className="w-5 h-5 text-red-500" />
                    ) : (
                      <HiOutlineHeart className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-500">
                      {testimonial.helpful + (likedTestimonials.includes(testimonial.id) ? 1 : 0)}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1"
                  >
                    <HiOutlineChat className="w-5 h-5 text-gray-500" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleBookmark(testimonial.id)}
                  >
                    {bookmarkedTestimonials.includes(testimonial.id) ? (
                      <BsBookmarkFill className="w-5 h-5 text-primary-600" />
                    ) : (
                      <BsBookmark className="w-5 h-5 text-gray-500" />
                    )}
                  </motion.button>
                </div>

                {/* Social Share */}
                {showSocial && (
                  <div className="flex gap-2">
                    <FaTwitter className="w-4 h-4 text-blue-400 cursor-pointer hover:scale-110" />
                    <FaFacebook className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110" />
                    <FaLinkedin className="w-4 h-4 text-blue-700 cursor-pointer hover:scale-110" />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderCarousel = () => (
    <div className="relative" ref={sliderRef}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={{
            enter: (direction) => ({
              x: direction > 0 ? 1000 : -1000,
              opacity: 0
            }),
            center: {
              x: 0,
              opacity: 1,
              transition: {
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }
            },
            exit: (direction) => ({
              x: direction < 0 ? 1000 : -1000,
              opacity: 0,
              transition: {
                duration: 0.5
              }
            })
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className="max-w-3xl mx-auto"
        >
          {/* Carousel Item */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="flex justify-center mb-6">
              {renderStars(activeTestimonials[currentIndex].rating)}
            </div>
            
            <div className="text-center mb-6">
              <FaQuoteLeft className={`inline-block w-8 h-8 opacity-30 mb-4 ${darkMode ? 'text-white' : 'text-gray-400'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                "{activeTestimonials[currentIndex].content}"
              </p>
            </div>

            <div className="flex items-center justify-center">
              <img
                src={activeTestimonials[currentIndex].avatar}
                alt={activeTestimonials[currentIndex].name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="ml-4 text-left">
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {activeTestimonials[currentIndex].name}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeTestimonials[currentIndex].role}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel Controls */}
      {showArrows && (
        <>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === activeTestimonials.length - 1}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && (
        <div className="flex justify-center mt-6 space-x-2">
          {activeTestimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-primary-600' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderMasonry = () => {
    const columns = 3;
    const columnContents = Array.from({ length: columns }, () => []);

    filteredTestimonials.forEach((item, index) => {
      columnContents[index % columns].push(item);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnContents.map((column, colIndex) => (
          <div key={colIndex} className="space-y-6">
            {column.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Masonry item content */}
                <img
                  src={testimonial.images?.[0] || testimonial.avatar}
                  alt={testimonial.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex mb-2">{renderStars(testimonial.rating)}</div>
                  <p className="text-gray-700 text-sm mb-2">{testimonial.content.substring(0, 100)}...</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="ml-2">
                      <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderFeatured = () => {
    const featured = filteredTestimonials[0];
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <FaQuoteRight className="w-64 h-64 absolute -bottom-10 -right-10 text-white" />
        </div>
        
        <div className="relative z-10 p-12 text-white">
          <div className="flex items-center gap-2 mb-6">
            {renderStars(featured.rating)}
          </div>
          
          <p className="text-2xl mb-8 italic">"{featured.content}"</p>
          
          <div className="flex items-center">
            <img
              src={featured.avatar}
              alt={featured.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white"
            />
            <div className="ml-6">
              <h3 className="text-2xl font-bold">{featured.name}</h3>
              <p className="text-primary-100">{featured.role}</p>
              <div className="flex gap-4 mt-2">
                <FaTwitter className="cursor-pointer hover:scale-110" />
                <FaFacebook className="cursor-pointer hover:scale-110" />
                <FaInstagram className="cursor-pointer hover:scale-110" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8 gap-2">
          {['all', '5', '4', '3'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full transition-all ${
                selectedFilter === filter
                  ? 'bg-primary-600 text-white'
                  : `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} hover:bg-gray-100`
              }`}
            >
              {filter === 'all' ? 'All Reviews' : `${filter} Stars`}
            </button>
          ))}
        </div>

        {/* Testimonials Display */}
        <div ref={containerRef}>
          {variant === 'carousel' && renderCarousel()}
          {variant === 'masonry' && renderMasonry()}
          {variant === 'featured' && renderFeatured()}
          {variant === 'grid' && renderGrid()}
          {variant === 'cards' && renderGrid()}
          {variant === 'minimal' && renderGrid()}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/reviews"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
          >
            View All Reviews
            <HiChevronRight className="ml-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Skeleton Loader
export const TestimonialsSkeleton = () => (
  <section className="py-16 bg-gray-50">
    <div className="container-custom">
      <div className="text-center mb-12">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
        <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="ml-3 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;