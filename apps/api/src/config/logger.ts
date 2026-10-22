type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  [key: string]: unknown;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  },
  log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const isProduction = process.env.NODE_ENV === 'production';
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (isProduction) {
      process.stdout.write(`${JSON.stringify(payload)}\n`);
    } else {
      const prefix = `[${payload.timestamp}] [${level.toUpperCase()}]`;
      if (level === 'error') {
        console.error(prefix, message, meta || '');
      } else if (level === 'warn') {
        console.warn(prefix, message, meta || '');
      } else {
        console.log(prefix, message, meta || '');
      }
    }
  },
};

export default logger;
