import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.model';
import { RefreshToken } from '../models/RefreshToken.model';
import { AppError } from '../middleware/errorHandler';
import env from '../config/env';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || env.JWT_SECRET;
  if (!secret || secret === 'secret') {
    throw new AppError('Server configuration error: JWT secret is invalid or not configured', 500);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new AppError('Server configuration error: JWT_SECRET environment variable is missing in production', 500);
  }
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET;
  if (!secret || secret === 'secret') {
    throw new AppError('Server configuration error: JWT refresh secret is invalid or not configured', 500);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_REFRESH_SECRET) {
    throw new AppError('Server configuration error: JWT_REFRESH_SECRET environment variable is missing in production', 500);
  }
  return secret;
}

export function signAccessToken(payload: { _id: string; email: string; role: string }): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRE || '15m',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: { _id: string; familyId: string }): string {
  const secret = getJwtRefreshSecret();
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    } as jwt.SignOptions,
  );
}

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const email = data.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const user = await User.create({
      name: data.name,
      email,
      password: data.password,
    });

    const familyId = crypto.randomUUID();
    const token = signAccessToken({
      _id: String(user._id),
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken({ _id: String(user._id), familyId });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      userId: user._id,
      familyId,
      expiresAt,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
      token,
      refreshToken,
    };
  }

  async login(data: { email: string; password: string }) {
    const email = data.email.toLowerCase();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(data.password))) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    const familyId = crypto.randomUUID();
    const token = signAccessToken({
      _id: String(user._id),
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken({ _id: String(user._id), familyId });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      userId: user._id,
      familyId,
      expiresAt,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
      token,
      refreshToken,
    };
  }

  async rotateRefreshToken(token: string) {
    if (!token) {
      throw new AppError('Refresh token required', 401);
    }

    const tokenHash = hashToken(token);

    const secret = getJwtRefreshSecret();
    let decoded: { _id: string; familyId: string };
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { _id: string; familyId: string };
    } catch {
      const revoked = await RefreshToken.findOne({ tokenHash, isRevoked: true });
      if (revoked) {
        await RefreshToken.updateMany({ familyId: revoked.familyId }, { isRevoked: true });
        throw new AppError('Token reuse detected. All sessions revoked for security.', 401);
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const updatedRecord = await RefreshToken.findOneAndUpdate(
      { tokenHash, isRevoked: false },
      { $set: { isRevoked: true } },
      { new: true },
    );

    if (!updatedRecord) {
      const revoked = await RefreshToken.findOne({ tokenHash, isRevoked: true });
      if (revoked) {
        await RefreshToken.updateMany({ familyId: revoked.familyId }, { isRevoked: true });
        throw new AppError('Token reuse detected. All sessions revoked for security.', 401);
      }
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    // Issue new tokens in same family
    const newAccessToken = signAccessToken({
      _id: String(user._id),
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = signRefreshToken({ _id: String(user._id), familyId: updatedRecord.familyId });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(newRefreshToken),
      userId: user._id,
      familyId: updatedRecord.familyId,
      expiresAt,
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(token?: string) {
    if (token) {
      const tokenHash = hashToken(token);
      const record = await RefreshToken.findOne({ tokenHash });
      if (record) {
        await RefreshToken.updateMany({ familyId: record.familyId }, { isRevoked: true });
      } else {
        await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
      }
    }
  }

  async getCurrentUser(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId).lean();
    return user as unknown as IUser;
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return {
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
      resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all active refresh sessions
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

    return {
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.',
    };
  }
}

export const authService = new AuthService();
export default authService;
