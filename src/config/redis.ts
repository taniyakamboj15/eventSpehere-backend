import IORedis from 'ioredis';
import { logger } from './logger';

export const redisConnection = process.env.REDIS_URL 
    ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
    });

redisConnection.on('connect', () => {
    logger.info('Redis connected successfully');
});

redisConnection.on('error', (error) => {
    logger.error('Redis connection error:', error);
});
