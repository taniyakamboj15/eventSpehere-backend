import { Router } from 'express';
import { redisConnection } from '../config/redis';
import mongoose from 'mongoose';
import { env } from '../config/env';

const router = Router();

/**
 * @swagger
 * /health/health:
 *   get:
 *     summary: Comprehensive health check
 *     tags: [Health]
 *     description: Returns detailed health status of all services (API, Database, Redis)
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: production
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       example: healthy
 *                     database:
 *                       type: string
 *                       example: healthy
 *                     redis:
 *                       type: string
 *                       example: healthy
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     total:
 *                       type: number
 *                     unit:
 *                       type: string
 *                       example: MB
 *       503:
 *         description: One or more services are unhealthy
 */
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    services: {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
    },
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      unit: 'MB',
    },
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'healthy';
    } else {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check Redis connection
    const redisPing = await redisConnection.ping();
    if (redisPing === 'PONG') {
      healthCheck.services.redis = 'healthy';
    } else {
      healthCheck.services.redis = 'unhealthy';
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.services.redis = 'unhealthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     description: Kubernetes/load balancer readiness check - returns 200 if ready to accept traffic
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: true
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: false
 *                 reason:
 *                   type: string
 *                   example: Database not connected
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ ready: false, reason: 'Database not connected' });
    }

    // Check if Redis is ready
    const redisPing = await redisConnection.ping();
    if (redisPing !== 'PONG') {
      return res.status(503).json({ ready: false, reason: 'Redis not connected' });
    }

    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: 'Service check failed' });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     description: Kubernetes/container orchestration liveness check - returns 200 if process is alive
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alive:
 *                   type: boolean
 *                   example: true
 */
router.get('/live', (req, res) => {
  res.json({ alive: true });
});

export default router;
