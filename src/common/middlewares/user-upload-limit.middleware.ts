/**
 * Per-User Upload Limit Middleware
 * Tracks uploads per user (not just per IP) to prevent abuse
 */

import { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../../config/redis';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../../modules/user/user.types';
import { logger } from '../../config/logger';
import {
  UPLOAD_LIMITS_BY_ROLE,
  UPLOAD_LIMIT_TIME_WINDOW,
  UPLOAD_LIMIT_REDIS_KEY_PREFIX,
} from '../constants/upload-security.constants';
import { AuthenticatedUser, UserUploadStats, UploadLimitsByRole } from '../types/upload-security.types';

/**
 * Upload limits configuration
 */
const UPLOAD_LIMITS: UploadLimitsByRole = {
  [UserRole.ATTENDEE]: UPLOAD_LIMITS_BY_ROLE.ATTENDEE,
  [UserRole.ORGANIZER]: UPLOAD_LIMITS_BY_ROLE.ORGANIZER,
  [UserRole.ADMIN]: UPLOAD_LIMITS_BY_ROLE.ADMIN,
};

/**
 * Extract authenticated user from request
 */
const getAuthenticatedUser = (req: Request): AuthenticatedUser | null => {
  const user = (req as Request & { user?: AuthenticatedUser }).user;
  return user || null;
};

/**
 * Generate Redis key for user upload limit
 */
const getRedisKey = (userId: string): string => {
  return `${UPLOAD_LIMIT_REDIS_KEY_PREFIX}${userId}`;
};

/**
 * Get upload limit for user role
 */
const getUploadLimit = (userRole: UserRole): number => {
  return UPLOAD_LIMITS[userRole];
};

/**
 * Get current upload count from Redis
 */
const getCurrentUploadCount = async (redisKey: string): Promise<number> => {
  const currentCount = await redisConnection.get(redisKey);
  return currentCount ? parseInt(currentCount, 10) : 0;
};

/**
 * Check if upload limit is exceeded
 */
const isLimitExceeded = (count: number, limit: number): boolean => {
  return count >= limit;
};

/**
 * Increment upload counter in Redis
 */
const incrementUploadCounter = async (
  redisKey: string,
  currentCount: number
): Promise<void> => {
  if (currentCount === 0) {
    // First upload - set with expiry
    await redisConnection.setex(redisKey, UPLOAD_LIMIT_TIME_WINDOW, '1');
  } else {
    // Increment existing counter
    await redisConnection.incr(redisKey);
  }
};

/**
 * Set upload limit headers on response
 */
const setUploadLimitHeaders = (
  res: Response,
  limit: number,
  remaining: number
): void => {
  res.setHeader('X-Upload-Limit', limit.toString());
  res.setHeader('X-Upload-Remaining', remaining.toString());
  res.setHeader('X-Upload-Reset', UPLOAD_LIMIT_TIME_WINDOW.toString());
};

/**
 * Log upload limit check
 */
const logUploadCheck = (
  userId: string,
  userRole: UserRole,
  count: number,
  limit: number
): void => {
  logger.info(`User ${userId} (${userRole}) upload count: ${count}/${limit}`);
};

/**
 * Log upload allowed
 */
const logUploadAllowed = (
  userId: string,
  newCount: number,
  limit: number
): void => {
  logger.info(`Upload allowed for user ${userId}. New count: ${newCount}/${limit}`);
};

/**
 * Handle Redis errors gracefully
 */
const handleRedisError = (error: unknown, next: NextFunction): void => {
  logger.error('Error in user upload limit middleware:', error);
  // Don't block upload on Redis errors
  next();
};

/**
 * Check and enforce per-user upload limits
 */
export const userUploadLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user || !user.userId) {
      // If no user (shouldn't happen with authenticate middleware), skip
      return next();
    }

    const { userId, role: userRole } = user;
    const limit = getUploadLimit(userRole);
    const redisKey = getRedisKey(userId);

    // Get current upload count
    const count = await getCurrentUploadCount(redisKey);

    logUploadCheck(userId, userRole, count, limit);

    // Check if limit exceeded
    if (isLimitExceeded(count, limit)) {
      throw new ApiError(
        429,
        `Upload limit exceeded. ${userRole}s can upload ${limit} files per day. Please try again tomorrow.`
      );
    }

    // Increment counter
    await incrementUploadCounter(redisKey, count);
    const newCount = count + 1;

    logUploadAllowed(userId, newCount, limit);

    // Set response headers
    setUploadLimitHeaders(res, limit, limit - newCount);

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      handleRedisError(error, next);
    }
  }
};

/**
 * Get user's current upload statistics
 */
export const getUserUploadStats = async (
  userId: string,
  userRole: UserRole
): Promise<UserUploadStats> => {
  const limit = getUploadLimit(userRole);
  const redisKey = getRedisKey(userId);

  try {
    const used = await getCurrentUploadCount(redisKey);
    const ttl = await redisConnection.ttl(redisKey);

    return {
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetsIn: ttl > 0 ? ttl : UPLOAD_LIMIT_TIME_WINDOW,
    };
  } catch (error) {
    logger.error('Error getting upload stats:', error);
    return {
      limit,
      used: 0,
      remaining: limit,
      resetsIn: UPLOAD_LIMIT_TIME_WINDOW,
    };
  }
};
