import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AppError } from './errorHandler';
import { User } from '../models/User.model';

import env from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: string;
        isBlocked?: boolean;
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    isBlocked?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
  };
}

export function getAuthenticatedUser(req: Request): {
  _id: string;
  email: string;
  role: string;
  isBlocked?: boolean;
} {
  if (!req.user || !req.user._id) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
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

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
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

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }
    next();
  });
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.split(' ')[1]
    : (req.query?.token as string | undefined);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    // If token invalid in optionalAuth, continue as unauthenticated guest
    next();
  }
}

export function requireVerified(options: { email?: boolean; phone?: boolean }) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?._id) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      // Admins bypass customer verification requirements
      if (req.user.role === 'admin') {
        return next();
      }

      let isEmailVerified = Boolean(req.user.isEmailVerified);
      let isPhoneVerified = Boolean(req.user.isPhoneVerified);

      if (
        mongoose.connection.readyState === 1 &&
        req.user._id &&
        mongoose.isValidObjectId(req.user._id)
      ) {
        const user = await User.findById(req.user._id)
          .select('isEmailVerified isPhoneVerified role')
          .lean();
        if (!user) {
          return next(new AppError('User not found', 404));
        }
        if (user.role === 'admin') {
          return next();
        }
        isEmailVerified = Boolean(user.isEmailVerified);
        isPhoneVerified = Boolean(user.isPhoneVerified);
      }

      if (options.email && !isEmailVerified) {
        return next(new AppError('Email verification required to access this resource.', 403));
      }

      if (options.phone && !isPhoneVerified) {
        return next(new AppError('Phone verification required to access this resource.', 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
