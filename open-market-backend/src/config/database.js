import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      logger.error('MONGODB_URI is not defined in environment variables');
      logger.info('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }

    logger.info(`Attempting to connect to MongoDB...`);
    
    // In Mongoose v8+, many options are no longer needed
    // The connection string itself contains most configuration
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.error('Please make sure MongoDB is running and the URI is correct');
    
    // Log more details about the error
    if (error.name === 'MongooseServerSelectionError') {
      logger.error('Could not connect to any MongoDB server. Make sure MongoDB is running.');
      logger.error('If using local MongoDB, run: mongod');
      logger.error('If using MongoDB Atlas, check your connection string.');
    }
    
    process.exit(1);
  }
};

export default connectDB;