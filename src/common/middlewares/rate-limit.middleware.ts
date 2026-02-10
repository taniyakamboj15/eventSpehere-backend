import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../../config/redis';
import { env } from '../../config/env';

// Skip rate limiting in development for localhost
const skip = (req: any) => {
  return env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1');
};

// Redis store configuration
const store = new RedisStore({
  // @ts-expect-error - rate-limit-redis types are not fully compatible
  sendCommand: (...args: string[]) => redisConnection.call(...args),
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store,
  skip,
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store,
  skip,
  message: 'Too many authentication attempts, please try again later',
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  store,
  skip,
  message: 'Too many upload requests, please try again later',
});

// Create operations limiter
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 create operations per hour
  standardHeaders: true,
  legacyHeaders: false,
  store,
  skip,
  message: 'Too many create requests, please try again later',
});
