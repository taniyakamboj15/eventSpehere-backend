import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware with structured context
 * Adds request ID and logs all HTTP requests with timing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;

  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 * Logs all errors with full context
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;

  logger.error('Request error', {
    requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    ip: req.ip,
  });

  next(err);
};
