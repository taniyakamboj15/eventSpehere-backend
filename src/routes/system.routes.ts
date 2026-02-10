import { Router } from 'express';
import { getHealth } from '../modules/system/health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Legacy health check endpoint
 *     tags: [Health]
 *     deprecated: true
 *     description: Use /health/health, /health/ready, or /health/live instead
 *     responses:
 *       200:
 *         description: System is healthy
 */
router.get('/health', getHealth);

export default router;
