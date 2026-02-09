import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from './common/middlewares/error.middleware';
import { logger } from './config/logger';
import { configureMiddlewares } from './config/middleware';
import apiRouter from './routes';
import systemRouter from './routes/system.routes';

const app = express();


configureMiddlewares(app);

app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.headers['x-request-id'] = requestId;
    logger.info(`${req.method} ${req.originalUrl}`, { 'x-request-id': requestId });
    next();
});

app.use('/api', apiRouter);
app.use('/', systemRouter);

app.use(errorHandler);

export default app;
