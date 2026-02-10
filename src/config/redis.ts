import IORedis from 'ioredis';
import { logger } from './logger';
import { env } from './env';

export const redisConnection = env.REDIS_URL 
    ? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
    : new IORedis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        maxRetriesPerRequest: null,
    });

redisConnection.on('connect', () => {
    logger.info('Redis connected successfully');
});

redisConnection.on('error', (error) => {
    logger.error('Redis connection error:', error);
});

