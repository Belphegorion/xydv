import mongoose from 'mongoose';
import env from './env';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  const uri = env.MONGODB_URI;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 50,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      break;
    } catch (error) {
      retryCount++;
      logger.error(`MongoDB connection attempt ${retryCount}/${maxRetries} failed:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }
      // Exponential backoff
      await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, retryCount)));
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error:', {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed gracefully');
  }
}
