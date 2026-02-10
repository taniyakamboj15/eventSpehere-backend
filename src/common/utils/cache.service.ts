import { redisConnection } from '../../config/redis';
import { logger } from '../../config/logger';

/**
 * Redis-based caching service for improved performance
 * Provides methods for get, set, delete, and pattern-based invalidation
 */
export class CacheService {
  private readonly defaultTTL = 3600; // 1 hour in seconds

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisConnection.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null; // Fail gracefully
    }
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttl Time to live in seconds (default: 1 hour)
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redisConnection.setex(key, ttl, JSON.stringify(value));
      logger.debug('Cache set:', { key, ttl });
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      // Don't throw - caching failures shouldn't break the app
    }
  }

  /**
   * Delete a specific key from cache
   * @param key Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await redisConnection.del(key);
      logger.debug('Cache deleted:', { key });
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  /**
   * Invalidate all keys matching a pattern
   * @param pattern Redis key pattern (e.g., 'events:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisConnection.keys(pattern);
      if (keys.length > 0) {
        await redisConnection.del(...keys);
        logger.info('Cache pattern invalidated:', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidate pattern error:', { pattern, error });
    }
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns true if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisConnection.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   * @param key Cache key
   * @param fetchFn Function to execute if cache miss
   * @param ttl Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug('Cache hit:', { key });
      return cached;
    }

    // Cache miss - fetch data
    logger.debug('Cache miss:', { key });
    const data = await fetchFn();
    
    // Store in cache for next time
    await this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll(): Promise<void> {
    try {
      await redisConnection.flushdb();
      logger.warn('Cache flushed - all keys deleted');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key builders for consistency
export const CacheKeys = {
  event: (id: string) => `event:${id}`,
  eventList: (page: number, limit: number, filters?: string) => 
    `events:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
  userProfile: (userId: string) => `user:${userId}`,
  community: (id: string) => `community:${id}`,
  communityMembers: (id: string) => `community:${id}:members`,
  rsvpList: (eventId: string) => `event:${eventId}:rsvps`,
} as const;
