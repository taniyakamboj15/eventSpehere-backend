import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

import './modules/notification/notification.worker';
import { startRecurringEventsJob } from './jobs/recurring.job';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    startRecurringEventsJob();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
