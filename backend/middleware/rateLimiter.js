import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import logger from '../utils/logger.js';

const isProd = process.env.NODE_ENV === 'production';

let redisClient = null;
if (isProd && process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected for rate limiting');
  });
}

const getStore = () => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  }
  return undefined;
};

export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: isProd ? 2000 : 10000,
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
    store: getStore(),
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
  windowMs: 60 * 1000,
  max: isProd ? 120 : 1000,
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute',
  },
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 50 : 500,
  message: {
    error: 'Upload limit reached, please try again later.',
    retryAfter: '1 hour',
  },
});

export const sessionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 50 : 1000,
  message: {
    error: 'Too many session booking requests, please try again later.',
    retryAfter: '1 hour',
  },
  skip: (req) => req.method !== 'POST',
});

export const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: isProd ? 120 : 1000,
  message: {
    error: 'Too many messages, please slow down.',
    retryAfter: '1 minute',
  },
});

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};