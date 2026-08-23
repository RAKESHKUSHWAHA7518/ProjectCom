import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      });
    },
    skip: (req) => {
      if (req.path.startsWith('/api/health')) return true;
      return false;
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
});

export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute',
  },
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Upload limit reached, please try again later.',
    retryAfter: '1 hour',
  },
});

export const sessionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 session bookings per hour
  message: {
    error: 'Too many session requests, please try again later.',
    retryAfter: '1 hour',
  },
});

export const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    error: 'Too many messages, please slow down.',
    retryAfter: '1 minute',
  },
});