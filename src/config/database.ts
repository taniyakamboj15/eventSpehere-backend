import mongoose from 'mongoose';
import { logger } from './logger';

export const connectDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eventsphere';
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
