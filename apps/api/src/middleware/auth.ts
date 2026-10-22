import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AppError } from './errorHandler';
import { User } from '../models/User.model';

import env from '../config/env';

export interface AuthRequest extends Request {
  user?: { _id: string; email: string; role: string; isBlocked?: boolean };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || env.JWT_SECRET;
  if (!secret || secret === 'secret') {
    throw new AppError('Server configuration error: JWT secret is invalid or not configured', 500);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new AppError(
      'Server configuration error: JWT_SECRET environment variable is missing in production',
      500,
    );
  }
  return secret;
}

function verifyToken(token: string): {
  _id: string;
  email: string;
  role: string;
  isBlocked?: boolean;
} {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
    _id: string;
    email: string;
    role: string;
    isBlocked?: boolean;
  };
}

export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  const token = header.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;

    if (payload.isBlocked === true) {
      return next(new AppError('Your account has been suspended. Please contact support.', 403));
    }

    if (
      mongoose.connection.readyState === 1 &&
      payload._id &&
      mongoose.isValidObjectId(payload._id)
    ) {
      const user = await User.findById(payload._id).select('isBlocked role').lean();
      if (!user) {
        return next(new AppError('User account no longer exists', 401));
      }
      if (user.isBlocked) {
        return next(new AppError('Your account has been suspended. Please contact support.', 403));
      }
      req.user = { ...payload, role: user.role };
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }
    next();
  });
}
