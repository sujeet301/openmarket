import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

export const configureSocket = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 New client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle joining order room
    socket.on('join-order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    // Handle leaving order room
    socket.on('leave-order', (orderId) => {
      socket.leave(`order:${orderId}`);
      logger.info(`Socket ${socket.id} left order room: ${orderId}`);
    });

    // Handle seller joining their store room
    if (socket.userRole === 'seller') {
      socket.on('join-store', (storeId) => {
        socket.join(`store:${storeId}`);
        logger.info(`Seller ${socket.userId} joined store room: ${storeId}`);
      });
    }

    // Handle admin room
    if (socket.userRole === 'admin') {
      socket.join('admin');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  return io;
};