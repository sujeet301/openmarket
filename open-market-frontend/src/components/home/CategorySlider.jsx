import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiChevronLeft, 
  HiChevronRight, 
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineHeart,
  HiOutlineEye
} from 'react-icons/hi';

const CategorySlider = ({ 
  categories = [],
  autoplay = true,
  autoplaySpeed = 5000,
  showArrows = true,
  showDots = true,
  slidesToShow = 6,
  slidesToScroll = 2,
  title = "Shop by Category",
  subtitle = "Explore our wide range of categories"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Responsive slides calculation
  const getSlidesToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 768) return 3;
      if (window.innerWidth < 1024) return 4;
      if (window.innerWidth < 1280) return 5;
    }
    return slidesToShow;
  };

  const [responsiveSlides, setResponsiveSlides] = useState(getSlidesToShow());

  useEffect(() => {
    const handleResize = () => {
      setResponsiveSlides(getSlidesToShow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (autoplay && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, autoplaySpeed);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [autoplay, isHovered, currentIndex]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => 
      prev === 0 ? Math.max(0, categories.length - responsiveSlides) : prev - slidesToScroll
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => 
      prev >= categories.length - responsiveSlides ? 0 : prev + slidesToScroll
    );
  };

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart && touchEnd) {
      const diff = touchStart - touchEnd;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Drag events
  const handleDragStart = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setScrollX(diff);
  };

  const handleDragEnd = () => {
    if (isDragging) {
      if (Math.abs(scrollX) > 100) {
        if (scrollX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
      setIsDragging(false);
      setScrollX(0);
    }
  };

  // Category card variants for animations
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -8,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    },
    hover: {
      rotate: [0, -10, 10, -5, 0],
      scale: 1.1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Get category icon based on name or use default
  const getCategoryIcon = (category) => {
    const iconMap = {
      'electronics': HiOutlineSparkles,
      'fashion': HiOutlineTag,
      'home': HiOutlineHeart,
      'beauty': HiOutlineStar,
      'sports': HiOutlineFire,
      'books': HiOutlineTrendingUp,
      'toys': HiOutlineClock,
      'default': HiOutlineShoppingBag
    };

    const iconKey = category.name?.toLowerCase() || 'default';
    return iconMap[iconKey] || iconMap.default;
  };

  // Get gradient based on category index
  const getGradient = (index) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600'
    ];
    return gradients[index % gradients.length];
  };

  if (!categories || categories.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <HiOutlineShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No categories available</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new categories</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Slider Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          <AnimatePresence>
            {showArrows && isHovered && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20
                    bg-white rounded-full p-3 shadow-lg hover:shadow-xl
                    transition-all duration-300 hover:scale-110
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Previous categories"
                >
                  <HiChevronLeft className="w-6 h-6 text-gray-800" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20
                    bg-white rounded-full p-3 shadow-lg hover:shadow-xl
                    transition-all duration-300 hover:scale-110
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Next categories"
                >
                  <HiChevronRight className="w-6 h-6 text-gray-800" />
                </motion.button>
              </>
            )}
          </AnimatePresence>

          {/* Categories Slider */}
          <div 
            ref={sliderRef}
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <motion.div
              className="flex gap-4"
              animate={{ 
                x: -currentIndex * (100 / responsiveSlides) * (100 / categories.length) 
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              drag="x"
              dragConstraints={sliderRef}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              {categories.map((category, index) => {
                const IconComponent = getCategoryIcon(category);
                const gradient = getGradient(index);
                
                return (
                  <motion.div
                    key={category._id || index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    whileHover="hover"
                    viewport={{ once: true }}
                    className="flex-none"
                    style={{ 
                      width: `calc(${100 / responsiveSlides}% - ${(responsiveSlides - 1) * 16 / responsiveSlides}px)` 
                    }}
                  >
                    <Link
                      to={`/category/${category.slug || category._id}`}
                      className="block group"
                      onClick={(e) => isDragging && e.preventDefault()}
                    >
                      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden
                        transform transition-all duration-300 group-hover:shadow-2xl">
                        
                        {/* Category Image */}
                        <div className="relative aspect-square overflow-hidden">
                          {category.image ? (
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.4 }}
                              src={category.image.url || category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${gradient} 
                              flex items-center justify-center p-8`}>
                              <motion.div
                                variants={iconVariants}
                                whileHover="hover"
                              >
                                <IconComponent className="w-16 h-16 text-white opacity-80" />
                              </motion.div>
                            </div>
                          )}

                          {/* Overlay with icon on hover */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black bg-opacity-30 
                              flex items-center justify-center"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              whileHover={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="bg-white rounded-full p-3"
                            >
                              <HiOutlineEye className="w-6 h-6 text-primary-600" />
                            </motion.div>
                          </motion.div>

                          {/* Product Count Badge */}
                          {category.productCount > 0 && (
                            <motion.div
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.1 }}
                              className="absolute top-3 right-3 bg-primary-600 text-white 
                                text-xs font-bold px-2 py-1 rounded-full"
                            >
                              {category.productCount}+ items
                            </motion.div>
                          )}
                        </div>

                        {/* Category Info */}
                        <div className="p-4 text-center">
                          <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 
                            transition-colors duration-300 text-lg mb-1">
                            {category.name}
                          </h3>
                          
                          {category.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {category.description}
                            </p>
                          )}

                          {/* Subcategories Preview */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center mb-3">
                              {category.subcategories.slice(0, 3).map(sub => (
                                <span 
                                  key={sub._id}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                >
                                  {sub.name}
                                </span>
                              ))}
                              {category.subcategories.length > 3 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                  +{category.subcategories.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Explore Link */}
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="inline-flex items-center text-primary-600 
                              text-sm font-medium group-hover:text-primary-700"
                          >
                            Explore Now
                            <HiChevronRight className="ml-1 w-4 h-4" />
                          </motion.div>
                        </div>

                        {/* Hover Effect Border */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r 
                            from-primary-500 to-primary-600 origin-left"
                        />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Dots Navigation */}
          {showDots && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(categories.length / slidesToScroll) }).map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleDotClick(index * slidesToScroll)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex / slidesToScroll === index
                      ? 'w-8 bg-primary-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200"
            initial={{ scaleX: 0 }}
            animate={{ 
              scaleX: (currentIndex + responsiveSlides) / categories.length 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* View All Categories Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/categories"
            className="inline-flex items-center px-8 py-3 bg-primary-600 text-white 
              rounded-lg font-semibold hover:bg-primary-700 transition-all duration-300
              transform hover:scale-105 hover:shadow-xl group"
          >
            View All Categories
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-2"
            >
              <HiChevronRight className="w-5 h-5" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Default props
CategorySlider.defaultProps = {
  categories: [],
  autoplay: true,
  autoplaySpeed: 5000,
  showArrows: true,
  showDots: true,
  slidesToShow: 6,
  slidesToScroll: 2,
  title: "Shop by Category",
  subtitle: "Explore our wide range of categories"
};

// Category Skeleton Loader
export const CategorySliderSkeleton = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse" />
        </div>

        {/* Slider Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-20 bg-gray-200 rounded mx-auto animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;