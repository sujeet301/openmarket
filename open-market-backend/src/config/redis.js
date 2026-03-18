import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient;
let connectionAttempted = false;

export const connectRedis = async () => {
  // Skip Redis if not configured (optional service)
  if (!process.env.REDIS_HOST) {
    logger.info('Redis not configured - skipping connection');
    return null;
  }

  // Prevent multiple connection attempts
  if (connectionAttempted) {
    return redisClient;
  }
  
  connectionAttempted = true;

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        if (times > 1) {
          logger.warn('Redis connection failed - continuing without Redis');
          return null; // Stop retrying after first attempt
        }
        return 100; // Try once after 100ms
      }
    });

    // Set a timeout for connection
    const connectTimeout = setTimeout(() => {
      logger.warn('Redis connection timeout - continuing without Redis');
      redisClient = null;
    }, 2000);

    await redisClient.connect();
    clearTimeout(connectTimeout);
    
    logger.info('✅ Redis connected');
    
    redisClient.on('error', (err) => {
      // Only log Redis errors if we actually have a client
      if (redisClient) {
        logger.debug('Redis client error:', err.message);
      }
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed (optional service) - continuing without Redis');
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};