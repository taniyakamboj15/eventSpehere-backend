import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisConnection } from '../../config/redis';
import { logger } from '../../config/logger';

interface HealthStatus {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    timestamp: string;
    uptime: number;
    environment: string | undefined;
    checks: {
        database: 'UP' | 'DOWN';
        redis: 'UP' | 'DOWN';
    };
}

export const getHealth = async (req: Request, res: Response) => {
    const healthstatus: HealthStatus = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        checks: {
            database: 'UP',
            redis: 'UP'
        }
    };

    try {
        // DB Check
        if (mongoose.connection.readyState !== 1) {
            healthstatus.checks.database = 'DOWN';
            healthstatus.status = 'DEGRADED';
        }

        // Redis Check
        try {
            await redisConnection.ping();
        } catch (err) {
            healthstatus.checks.redis = 'DOWN';
            healthstatus.status = 'DEGRADED';
        }

        const statusCode = healthstatus.status === 'UP' ? 200 : 503;
        res.status(statusCode).json(healthstatus);
    } catch (error) {
        logger.error('Health check failed', error);
        res.status(500).json({ status: 'DOWN', error: (error as Error).message });
    }
};
