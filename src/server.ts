import 'dotenv/config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { redisConnection } from './config/redis';
import './modules/notification/notification.worker';
import { startRecurringEventsJob } from './jobs/recurring.job';
import { env } from './config/env';
import { initializeScanner } from './common/utils/virus-scanner';

const PORT = env.PORT;

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    await connectDatabase();
    
    // Initialize virus scanner
    logger.info('Initializing virus scanner...');
    await initializeScanner();
    
    startRecurringEventsJob();
    
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        await disconnectDatabase();
        
        // Close Redis connection
        await redisConnection.quit();
        logger.info('Redis connection closed');
        
        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

startServer();

