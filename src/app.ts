import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './common/middlewares/error.middleware';
import { logger } from './config/logger';
import { configureMiddlewares } from './config/middleware';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';
import systemRouter from './routes/system.routes';
import healthRouter from './routes/health.routes';

const app = express();


configureMiddlewares(app);

app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.headers['x-request-id'] = requestId;
    logger.info(`${req.method} ${req.originalUrl}`, { 'x-request-id': requestId });
    next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EventSphere API Documentation',
}));

// Health check routes (no /api prefix for load balancers)
app.use('/health', healthRouter);
app.use('/api', apiRouter);
app.use('/', systemRouter);

app.use(errorHandler);

export default app;
