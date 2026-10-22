import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ApiError extends Error {
  statusCode?: number;
  code?: number;
  path?: string;
  value?: unknown;
  issues?: Array<{ path: (string | number)[]; message: string }>;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    const issueMessages = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    message = issueMessages.length ? issueMessages.join(', ') : 'Validation error';
  } else if (err.name === 'ZodError' && err.issues) {
    statusCode = 400;
    const issueMessages = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    message = issueMessages.length ? issueMessages.join(', ') : 'Validation error';
  }
  // 2. Mongoose Validation Errors
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }
  // 3. Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'}: ${err.value}`;
  }
  // 4. MongoDB Duplicate Key (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value entered for ${fields.join(', ') || 'unique field'}.`;
  }
  // 5. JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired, please log in again';
  }
  // 6. CORS Policy Errors
  else if (err.message === 'Blocked by CORS policy') {
    statusCode = 403;
    message = 'Blocked by CORS policy';
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Strictly hide 5xx server error details and stack in production
  if (isProduction && statusCode >= 500) {
    message = 'Internal Server Error';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled Server Error', {
      error: err.message,
      stack: err.stack,
      statusCode,
      url: _req.originalUrl,
      method: _req.method,
    });
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    error: message,
    message,
  };

  if (!isProduction && err?.stack) {
    responseBody.stack = err.stack;
  } else {
    delete responseBody.stack;
  }

  res.status(statusCode).json(responseBody);
}

export default errorHandler;
