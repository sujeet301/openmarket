import dotenv from 'dotenv';
import { httpServer } from './src/app.js';
import logger from './src/utils/logger.js';
import connectDB from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';

// Load environment variables FIRST
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('Please check your .env file');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (optional)
    try {
      await connectRedis();
    } catch (redisError) {
      logger.warn('Redis connection failed (optional service):', redisError.message);
    }
    
    // Start HTTP server
    const server = httpServer.listen(PORT, () => {
      logger.info(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`📡 API URL: http://localhost:${PORT}/api`);
      logger.info(`🌐 Accepting requests from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      logger.error(err.stack);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('💤 Process terminated');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();