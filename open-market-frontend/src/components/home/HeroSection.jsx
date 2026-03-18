import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiOutlineShoppingBag, 
  HiOutlineSparkles, 
  HiOutlineArrowRight,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh
} from 'react-icons/hi';
import { BsArrowDownCircle, BsArrowUpCircle } from 'react-icons/bs';
import { FaGooglePlay, FaApple } from 'react-icons/fa';

const HeroSection = ({
  slides = [],
  autoplay = true,
  autoplaySpeed = 5000,
  showArrows = true,
  showDots = true,
  showSearch = true,
  showStats = true,
  showAppButtons = true,
  variant = 'default', // default, split, fullscreen, minimal, video, gradient
  height = '90vh',
  overlay = true,
  overlayOpacity = 0.4,
  animationType = 'fade', // fade, slide, zoom, reveal
  parallax = true
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplay);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Default slides if none provided
  const defaultSlides = [
    {
      id: 1,
      title: 'Discover Amazing Products',
      subtitle: 'Shop the latest trends at unbeatable prices',
      description: 'From fashion to electronics, find everything you need in one place',
      image: 'https://images.unsplash.com/photo-1607082350899-7e8aa1c1a9a6?ixlib=rb-4.0.3',
      mobileImage: 'https://images.unsplash.com/photo-1607082350899-7e8aa1c1a9a6?ixlib=rb-4.0.3',
      cta: { text: 'Shop Now', link: '/shop' },
      secondaryCta: { text: 'Learn More', link: '/about' },
      badge: { text: 'New Arrivals', icon: HiOutlineSparkles }
    },
    {
      id: 2,
      title: 'Summer Sale Extravaganza',
      subtitle: 'Up to 70% off on selected items',
      description: 'Limited time offer. Don\'t miss out on amazing deals',
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3',
      mobileImage: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3',
      cta: { text: 'Shop Sale', link: '/sale' },
      secondaryCta: { text: 'View Details', link: '/sale-details' },
      badge: { text: 'Limited Time', icon: HiOutlineFire }
    },
    {
      id: 3,
      title: 'Free Shipping Worldwide',
      subtitle: 'On orders over $50',
      description: 'Fast and reliable shipping to over 200 countries',
      image: 'https://images.unsplash.com/photo-1607082348826-0b96d8b8c9b3?ixlib=rb-4.0.3',
      mobileImage: 'https://images.unsplash.com/photo-1607082348826-0b96d8b8c9b3?ixlib=rb-4.0.3',
      cta: { text: 'Start Shopping', link: '/shop' },
      secondaryCta: { text: 'Shipping Info', link: '/shipping' },
      badge: { text: 'Free Shipping', icon: HiOutlineTruck }
    }
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;

  // Autoplay functionality
  useEffect(() => {
    let interval;
    if (isAutoPlaying && variant !== 'video') {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % activeSlides.length);
      }, autoplaySpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeSlides.length, variant, autoplaySpeed]);

  // Mouse move effect for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current && variant === 'parallax') {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [variant]);

  // Hide scroll indicator after scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
    setIsAutoPlaying(false);
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    setIsAutoPlaying(false);
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.5
      }
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }
    })
  };

  const backgroundVariants = {
    initial: { scale: 1.2, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeOut"
      }
    }
  };

  const floatingIconsVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  // Stats data
  const stats = [
    { value: '1M+', label: 'Happy Customers', icon: HiOutlineStar },
    { value: '50K+', label: 'Products', icon: HiOutlineTag },
    { value: '24/7', label: 'Support', icon: HiOutlineClock },
    { value: 'Free', label: 'Shipping', icon: HiOutlineTruck }
  ];

  // Render different hero variants
  const renderHeroContent = () => {
    const slide = activeSlides[currentSlide];
    const BadgeIcon = slide.badge?.icon || HiOutlineSparkles;
    const direction = 1; // You can track direction for animations

    switch (variant) {
      case 'split':
        return (
          <div className="grid lg:grid-cols-2 min-h-screen">
            {/* Left Content */}
            <motion.div 
              className="flex items-center justify-center p-12 bg-gradient-to-br from-primary-600 to-primary-800 text-white"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="max-w-xl">
                {slide.badge && (
                  <motion.div
                    variants={textVariants}
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6"
                  >
                    <BadgeIcon className="w-5 h-5 mr-2" />
                    <span>{slide.badge.text}</span>
                  </motion.div>
                )}
                <motion.h1 
                  variants={textVariants}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  className="text-5xl md:text-6xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h1>
                <motion.h2 
                  variants={textVariants}
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl mb-4"
                >
                  {slide.subtitle}
                </motion.h2>
                <motion.p 
                  variants={textVariants}
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  className="text-lg mb-8 opacity-90"
                >
                  {slide.description}
                </motion.p>
                <motion.div 
                  variants={textVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap gap-4"
                >
                  <Link to={slide.cta.link} className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                    {slide.cta.text}
                  </Link>
                  <Link to={slide.secondaryCta.link} className="btn-secondary border-white text-white hover:bg-white hover:text-primary-600">
                    {slide.secondaryCta.text}
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div 
              className="relative h-screen"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent" />
            </motion.div>
          </div>
        );

      case 'video':
        return (
          <div className="relative h-screen overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src="/hero-video.mp4"
              loop
              muted
              playsInline
            />
            <div className={`absolute inset-0 bg-black ${overlay ? `opacity-${overlayOpacity * 100}` : ''}`} />
            
            <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
              <div className="max-w-4xl px-4">
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="text-5xl md:text-7xl font-bold mb-6"
                >
                  {activeSlides[0].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-xl md:text-2xl mb-8"
                >
                  {activeSlides[0].subtitle}
                </motion.p>
                
                {/* Video Controls */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleVideoPlay}
                  className="bg-white text-primary-600 p-4 rounded-full hover:scale-110 transition-transform"
                >
                  {isVideoPlaying ? <HiOutlinePause className="w-8 h-8" /> : <HiOutlinePlay className="w-8 h-8" />}
                </motion.button>
              </div>
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div className="relative min-h-screen flex items-center justify-center text-center">
            <div className="absolute inset-0">
              <img 
                src={activeSlides[currentSlide].image}
                alt="Hero"
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-black ${overlay ? `opacity-${overlayOpacity * 100}` : ''}`} />
            </div>
            
            <motion.div 
              className="relative z-10 max-w-4xl px-4 text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {activeSlides[currentSlide].title}
              </h1>
              <p className="text-xl mb-8 opacity-90">
                {activeSlides[currentSlide].description}
              </p>
              <Link 
                to={activeSlides[currentSlide].cta.link}
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                {activeSlides[currentSlide].cta.text}
                <HiOutlineArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        );

      case 'gradient':
        return (
          <div className="relative min-h-screen bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 overflow-hidden">
            {/* Animated Background Elements */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                borderRadius: ["20%", "50%", "20%"]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-20 left-20 w-64 h-64 bg-white opacity-10"
            />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                x: [0, 100, 0],
                y: [0, -100, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-10 rounded-full"
            />

            <div className="relative z-10 h-screen flex items-center justify-center text-white">
              <div className="text-center">
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="text-5xl md:text-7xl font-bold mb-6"
                >
                  {activeSlides[currentSlide].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-xl md:text-2xl mb-8 opacity-90"
                >
                  {activeSlides[currentSlide].subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-wrap gap-4 justify-center"
                >
                  <Link to={activeSlides[currentSlide].cta.link} className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                    {activeSlides[currentSlide].cta.text}
                  </Link>
                  <Link to={activeSlides[currentSlide].secondaryCta.link} className="btn-secondary border-white text-white hover:bg-white hover:text-primary-600">
                    {activeSlides[currentSlide].secondaryCta.text}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        );

      default: // default and fullscreen
        return (
          <div className="relative h-screen overflow-hidden">
            {/* Background Image with Parallax */}
            <motion.div
              style={parallax ? { 
                y: y1,
                scale: scale 
              } : {}}
              className="absolute inset-0"
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={currentSlide}
                  src={activeSlides[currentSlide].image}
                  alt={activeSlides[currentSlide].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  variants={backgroundVariants}
                  initial="initial"
                  animate="animate"
                  exit="initial"
                  custom={direction}
                />
              </AnimatePresence>
              
              {/* Overlay */}
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: overlayOpacity }}
              />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              variants={floatingIconsVariants}
              animate="animate"
              className="absolute top-20 left-20 text-white opacity-20"
            >
              <HiOutlineSparkles className="w-32 h-32" />
            </motion.div>
            <motion.div
              variants={floatingIconsVariants}
              animate="animate"
              custom={1}
              className="absolute bottom-20 right-20 text-white opacity-20"
            >
              <HiOutlineShoppingBag className="w-32 h-32" />
            </motion.div>

            {/* Main Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container-custom">
                <div className="max-w-3xl text-white">
                  {/* Badge */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`badge-${currentSlide}`}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                    >
                      <BadgeIcon className="w-5 h-5 mr-2" />
                      <span>{activeSlides[currentSlide].badge?.text || 'Featured Collection'}</span>
                    </motion.div>
                  </AnimatePresence>

                  {/* Title */}
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={`title-${currentSlide}`}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      custom={0}
                      className="text-5xl md:text-7xl font-bold mb-4"
                    >
                      {activeSlides[currentSlide].title}
                    </motion.h1>
                  </AnimatePresence>

                  {/* Subtitle */}
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={`subtitle-${currentSlide}`}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      custom={1}
                      className="text-2xl md:text-3xl mb-4 text-gray-200"
                    >
                      {activeSlides[currentSlide].subtitle}
                    </motion.h2>
                  </AnimatePresence>

                  {/* Description */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`desc-${currentSlide}`}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      custom={2}
                      className="text-lg mb-8 text-gray-300 max-w-2xl"
                    >
                      {activeSlides[currentSlide].description}
                    </motion.p>
                  </AnimatePresence>

                  {/* CTA Buttons */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`cta-${currentSlide}`}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      custom={3}
                      className="flex flex-wrap gap-4"
                    >
                      <Link 
                        to={activeSlides[currentSlide].cta.link}
                        className="btn-primary bg-white text-primary-600 hover:bg-gray-100 hover:scale-105 transition-transform"
                      >
                        {activeSlides[currentSlide].cta.text}
                      </Link>
                      <Link 
                        to={activeSlides[currentSlide].secondaryCta.link}
                        className="btn-secondary border-white text-white hover:bg-white hover:text-primary-600 hover:scale-105 transition-transform"
                      >
                        {activeSlides[currentSlide].secondaryCta.text}
                      </Link>
                    </motion.div>
                  </AnimatePresence>

                  {/* Search Bar */}
                  {showSearch && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="mt-12 max-w-xl"
                    >
                      <div className="relative group">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for products..."
                          className="w-full px-6 py-4 pr-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white text-primary-600 rounded-full hover:scale-110 transition-transform">
                          <HiOutlineSearch className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {showArrows && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-3 rounded-full transition-all z-20"
                >
                  <HiOutlineChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-3 rounded-full transition-all z-20"
                >
                  <HiOutlineChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots Navigation */}
            {showDots && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Autoplay Control */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="absolute bottom-8 right-8 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-full z-20"
            >
              {isAutoPlaying ? <HiOutlinePause className="w-5 h-5" /> : <HiOutlinePlay className="w-5 h-5" />}
            </button>
          </div>
        );
    }
  };

  return (
    <section ref={containerRef} className="relative">
      {/* Hero Content */}
      {renderHeroContent()}

      {/* Stats Bar */}
      {showStats && variant !== 'video' && variant !== 'split' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-md border-t border-white border-opacity-20"
        >
          <div className="container-custom py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center text-white"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-6 h-6 mr-2" />
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm opacity-80">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* App Download Buttons */}
      {showAppButtons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-8 flex gap-2 z-20"
        >
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <FaApple className="w-5 h-5" />
            <div>
              <div className="text-xs">Download on</div>
              <div className="text-sm font-semibold">App Store</div>
            </div>
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <FaGooglePlay className="w-5 h-5" />
            <div>
              <div className="text-xs">Get it on</div>
              <div className="text-sm font-semibold">Google Play</div>
            </div>
          </motion.a>
        </motion.div>
      )}

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white cursor-pointer z-20"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <BsArrowDownCircle className="w-8 h-8 opacity-75 hover:opacity-100 transition-opacity" />
        </motion.div>
      )}
    </section>
  );
};

// Skeleton Loader
export const HeroSectionSkeleton = () => (
  <div className="relative h-screen bg-gray-800">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 animate-pulse" />
    <div className="relative z-10 h-full flex items-center">
      <div className="container-custom">
        <div className="max-w-3xl">
          <div className="h-8 w-32 bg-gray-600 rounded-full mb-6 animate-pulse" />
          <div className="h-16 w-3/4 bg-gray-600 rounded-lg mb-4 animate-pulse" />
          <div className="h-12 w-2/3 bg-gray-600 rounded-lg mb-4 animate-pulse" />
          <div className="h-24 w-1/2 bg-gray-600 rounded-lg mb-8 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-14 w-32 bg-gray-600 rounded-lg animate-pulse" />
            <div className="h-14 w-32 bg-gray-600 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HeroSection;