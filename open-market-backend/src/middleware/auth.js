import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('You are not logged in. Please log in to access this resource.', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        throw new AppError('The user belonging to this token no longer exists.', 401);
      }

      // Check if user changed password after token was issued
      if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
        throw new AppError('User recently changed password. Please log in again.', 401);
      }

      // Grant access
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token. Please log in again.', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw new AppError('Your token has expired. Please log in again.', 401);
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

export const restrictToSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return next(new AppError('Only sellers can perform this action.', 403));
  }
  next();
};

export const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can perform this action.', 403));
  }
  next();
};