import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from './common/middlewares/error.middleware';
import { logger } from './config/logger';

const app = express();

import { limiter } from './common/middlewares/rate-limit.middleware';

import mongoSanitize from 'express-mongo-sanitize';

// Security Middlewares
app.use(helmet());
app.use(limiter);
app.use(mongoSanitize());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  credentials: true
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// RequestId & Logging Middleware
app.use((req, res, next) => {
  req.headers['x-request-id'] = (req.headers['x-request-id'] as string) || uuidv4();
  logger.info(`${req.method} ${req.originalUrl} - ${req.headers['x-request-id']}`);
  next();
});

// Routes
import router from './routes';
app.use('/api', router);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error Handling
app.use(errorHandler);

export default app;
