import mongoose from 'mongoose';
import env from './env';

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
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      break;
    } catch (error) {
      retryCount++;
      console.error(`❌ MongoDB connection attempt ${retryCount}/${maxRetries} failed:`, error);
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }
      // Exponential backoff
      await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, retryCount)));
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed gracefully');
  }
}
