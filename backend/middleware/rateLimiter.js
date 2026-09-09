import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const isProd = process.env.NODE_ENV === 'production';

export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 2000 : 10000, // 2000 in prod, 10000 in dev
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
      if (req.path.startsWith('/api/health') || req.path.includes('/login')) return true;
      return false;
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 2000 : 10000,
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
});

export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isProd ? 120 : 1000,
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute',
  },
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 50 : 500,
  message: {
    error: 'Upload limit reached, please try again later.',
    retryAfter: '1 hour',
  },
});

export const sessionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 50 : 1000,
  message: {
    error: 'Too many session booking requests, please try again later.',
    retryAfter: '1 hour',
  },
  skip: (req) => req.method !== 'POST',
});

export const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isProd ? 120 : 1000,
  message: {
    error: 'Too many messages, please slow down.',
    retryAfter: '1 minute',
  },
});