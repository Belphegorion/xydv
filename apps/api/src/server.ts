import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import fs from 'fs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/database';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { apiLimiter } from './middleware/rateLimiter';
import { inventoryService } from './services/inventory.service';
import logger from './config/logger';
import { UPLOADS_DIR } from './middleware/upload';
import env from './config/env';

export { UPLOADS_DIR };

const app = express();
const PORT = env.PORT ?? 5000;

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security & utility middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const rawOrigins = [
  ...(env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
  env.CLIENT_URL,
];

const allowedOrigins = Array.from(
  new Set(
    rawOrigins
      .flatMap((u) => (u ? u.split(',') : []))
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(compression() as express.RequestHandler);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static files for local image uploads
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Razorpay webhook needs raw body buffer for HMAC-SHA256 verification — must be before express.json()
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (bypass webhooks so payment delivery IPs are not throttled)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks')) return next();
  return apiLimiter(req, res, next);
});

// Health check with database connection readiness verification
app.get('/health', (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.status(200).json({
    status: 'ok',
    db: 'connected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

let server: Server | null = null;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      logger.info(`XYDV API running on http://localhost:${PORT}`, {
        port: PORT,
        env: env.NODE_ENV,
      });
      // Start background inventory hold reconciliation cleaner
      inventoryService.startReconciliationWorker();
    });
  })
  .catch((err) => {
    logger.error('Failed to start XYDV API server:', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  });

// Graceful shutdown handling
let isShuttingDown = false;
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`, { signal });

  inventoryService.stopReconciliationWorker();

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced process exit after timeout');
      process.exit(1);
    }, 10000).unref();
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', { reason: String(reason) });
  gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

export default app;
