import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {
  VerificationChallenge,
  type IVerificationChallenge,
} from '../models/VerificationChallenge.model';
import { User } from '../models/User.model';
import type {
  VerificationChannel,
  VerificationPurpose,
  VerificationSendResponse,
} from '@vertex/types';

export { type IVerificationChallenge };

// In-memory OTP sink for testing and verification assertions
export interface SentOtpRecord {
  target: string;
  channel: VerificationChannel;
  purpose: VerificationPurpose;
  code: string;
  token?: string;
  sentAt: Date;
}

export const sentOtpHistory: SentOtpRecord[] = [];

export interface VerificationProvider {
  sendSms(to: string, message: string): Promise<boolean>;
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export class MockVerificationProvider implements VerificationProvider {
  async sendSms(_to: string, _message: string): Promise<boolean> {
    return true;
  }
  async sendEmail(_to: string, _subject: string, _body: string): Promise<boolean> {
    return true;
  }
}

export class VerificationService {
  private static provider: VerificationProvider = new MockVerificationProvider();

  public static setProvider(customProvider: VerificationProvider): void {
    VerificationService.provider = customProvider;
  }

  private static getPepper(): string {
    return process.env.OTP_PEPPER || 'xydv-default-secure-otp-pepper-2026';
  }

  public static generateOtp(digits = 6): string {
    const min = 0;
    const max = 10 ** digits;
    return String(crypto.randomInt(min, max)).padStart(digits, '0');
  }

  public static hashOtp(code: string, challengeId: string, pepper = VerificationService.getPepper()): string {
    return crypto
      .createHmac('sha256', pepper)
      .update(`${challengeId}:${code}`)
      .digest('hex');
  }

  public static verifyOtp(
    code: string,
    challengeId: string,
    storedHash: string,
    pepper = VerificationService.getPepper(),
  ): boolean {
    const candidate = Buffer.from(VerificationService.hashOtp(code, challengeId, pepper), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    if (candidate.length !== stored.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidate, stored);
  }

  public static normalizePhone(phone: string): { isValid: boolean; normalized: string } {
    const cleaned = phone.replace(/[\s\-().]/g, '');
    // Indian standard: +91 followed by 10 digits starting with 6, 7, 8, or 9
    if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: cleaned };
    }
    if (/^91[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: `+${cleaned}` };
    }
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: `+91${cleaned}` };
    }
    if (/^0[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: `+91${cleaned.slice(1)}` };
    }
    return { isValid: false, normalized: cleaned };
  }

  public static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  public static hashTarget(target: string): string {
    return crypto.createHash('sha256').update(target).digest('hex');
  }

  public static maskTarget(target: string, channel: VerificationChannel): string {
    if (channel === 'sms') {
      const clean = target.replace(/\s+/g, '');
      if (clean.length >= 10) {
        const last4 = clean.slice(-4);
        const prefix = clean.startsWith('+91') ? '+91 ' : '';
        return `${prefix}******${last4}`;
      }
      return '******' + clean.slice(-2);
    }
    // Email masking
    const parts = target.split('@');
    if (parts.length === 2 && parts[0] && parts[1]) {
      const name = parts[0];
      const domain = parts[1];
      if (name.length <= 2) {
        return `${name[0]}***@${domain}`;
      }
      return `${name[0]}***@${domain}`;
    }
    return '***@***';
  }

  public static getLatestSentOtp(target: string): SentOtpRecord | undefined {
    const normalizedTarget = target.includes('@')
      ? VerificationService.normalizeEmail(target)
      : VerificationService.normalizePhone(target).normalized;
    const matches = sentOtpHistory.filter(
      (r) => r.target === normalizedTarget || r.target === target,
    );
    return matches[matches.length - 1];
  }

  public static clearSentOtpHistory(): void {
    sentOtpHistory.length = 0;
  }

  public static async sendVerification(params: {
    channel: VerificationChannel;
    target: string;
    purpose: VerificationPurpose;
    userId?: string;
    ip: string;
  }): Promise<VerificationSendResponse> {
    const { channel, target, purpose, userId, ip } = params;

    // Validate target
    let normalizedTarget = target;
    if (channel === 'sms') {
      const phoneCheck = VerificationService.normalizePhone(target);
      if (!phoneCheck.isValid) {
        throw new Error('Invalid Indian mobile number. Must be a 10-digit number starting with 6-9.');
      }
      normalizedTarget = phoneCheck.normalized;
    } else {
      normalizedTarget = VerificationService.normalizeEmail(target);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTarget)) {
        throw new Error('Invalid email address format.');
      }
    }

    const targetHash = VerificationService.hashTarget(normalizedTarget);
    const targetMasked = VerificationService.maskTarget(normalizedTarget, channel);
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    // 1. Daily limit check: Max 5 sends per number/email per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailySendCount = await VerificationChallenge.countDocuments({
      targetHash,
      createdAt: { $gte: oneDayAgo },
    });
    if (dailySendCount >= 5) {
      throw new Error('Daily verification limit exceeded for this destination. Please try again later.');
    }

    // 2. Cooldown check: 60-second resend cooldown per target
    const latestChallenge = await VerificationChallenge.findOne({ targetHash }).sort({ createdAt: -1 });
    if (latestChallenge) {
      const now = Date.now();
      const lastSent = latestChallenge.lastSentAt
        ? latestChallenge.lastSentAt.getTime()
        : latestChallenge.createdAt.getTime();
      const diffSec = Math.floor((now - lastSent) / 1000);
      if (diffSec < 60) {
        const remaining = 60 - diffSec;
        throw new Error(`Please wait ${remaining} seconds before requesting a new code.`);
      }
    }

    // Expire any existing active pending challenges for this target and purpose
    await VerificationChallenge.updateMany(
      { targetHash, purpose, status: 'pending' },
      { $set: { status: 'expired' } },
    );

    // Resolve user ID if unauthenticated request matches an existing customer account
    let resolvedUserId = userId;
    if (!resolvedUserId && mongoose.connection.readyState === 1) {
      if (channel === 'email') {
        const existing = await User.findOne({ email: normalizedTarget }).select('_id');
        if (existing) {
          resolvedUserId = existing._id.toString();
        }
      } else if (channel === 'sms') {
        const existing = await User.findOne({ phone: normalizedTarget }).select('_id');
        if (existing) {
          resolvedUserId = existing._id.toString();
        }
      }
    }

    // Generate challenge ID and Code
    const challengeId = new mongoose.Types.ObjectId();
    const otpCode = VerificationService.generateOtp(6);
    const emailToken = channel === 'email' ? crypto.randomBytes(32).toString('hex') : undefined;
    const tokenHash = emailToken ? crypto.createHash('sha256').update(emailToken).digest('hex') : undefined;

    const codeHash = VerificationService.hashOtp(otpCode, challengeId.toString());
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const challenge = await VerificationChallenge.create({
      _id: challengeId,
      userId: resolvedUserId ? new mongoose.Types.ObjectId(resolvedUserId) : undefined,
      channel,
      purpose,
      targetHash,
      targetMasked,
      codeHash,
      tokenHash,
      attempts: 0,
      maxAttempts: 5,
      sendCount: dailySendCount + 1,
      lastSentAt: new Date(),
      expiresAt,
      ipHash,
      status: 'pending',
    });

    // Record to testing sink
    sentOtpHistory.push({
      target: normalizedTarget,
      channel,
      purpose,
      code: otpCode,
      token: emailToken,
      sentAt: new Date(),
    });

    // Invoke abstracted provider (AWS SES / SMS or Mock)
    if (channel === 'sms') {
      await VerificationService.provider.sendSms(
        normalizedTarget,
        `Your XYDV verification code is ${otpCode}. Valid for 10 minutes.`,
      );
    } else {
      await VerificationService.provider.sendEmail(
        normalizedTarget,
        'XYDV Security Verification Code',
        `Your verification code is ${otpCode}. If using direct email verification link, use token: ${emailToken || ''}`,
      );
    }

    return {
      success: true,
      challengeId: challenge._id.toString(),
      targetMasked,
      cooldownSeconds: 60,
      expiresAt: expiresAt.toISOString(),
    };
  }

  public static async verifyChallenge(params: {
    challengeId: string;
    code?: string;
    token?: string;
    userId?: string;
  }): Promise<{
    verified: boolean;
    message: string;
    channel: VerificationChannel;
    purpose: VerificationPurpose;
  }> {
    const { challengeId, code, token, userId } = params;

    if (!mongoose.isValidObjectId(challengeId)) {
      throw new Error('Invalid challenge identifier.');
    }

    const challenge = await VerificationChallenge.findById(challengeId);
    if (!challenge) {
      throw new Error('Verification challenge not found or expired.');
    }

    if (challenge.status !== 'pending') {
      throw new Error(`This verification code is ${challenge.status}. Please request a new code.`);
    }

    if (challenge.expiresAt < new Date()) {
      challenge.status = 'expired';
      await challenge.save();
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.status = 'exhausted';
      await challenge.save();
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    let isValid = false;

    if (token && challenge.tokenHash) {
      const candidateHash = crypto.createHash('sha256').update(token).digest('hex');
      const candidateBuf = Buffer.from(candidateHash, 'hex');
      const storedBuf = Buffer.from(challenge.tokenHash, 'hex');
      isValid =
        candidateBuf.length === storedBuf.length &&
        crypto.timingSafeEqual(candidateBuf, storedBuf);
    } else if (code) {
      isValid = VerificationService.verifyOtp(code, challenge._id.toString(), challenge.codeHash);
    } else {
      throw new Error('Verification code or link token is required.');
    }

    if (!isValid) {
      // Atomic increment under database concurrency
      const updated = await VerificationChallenge.findOneAndUpdate(
        { _id: challenge._id, status: 'pending' },
        { $inc: { attempts: 1 } },
        { new: true },
      );
      const currentAttempts = updated ? updated.attempts : challenge.attempts + 1;
      const maxAttempts = challenge.maxAttempts || 5;
      const remaining = Math.max(0, maxAttempts - currentAttempts);
      if (currentAttempts >= maxAttempts) {
        await VerificationChallenge.findByIdAndUpdate(challenge._id, {
          $set: { status: 'exhausted' },
        });
      }
      throw new Error(
        remaining > 0
          ? `Invalid verification code. ${remaining} attempts remaining.`
          : 'Invalid verification code. Challenge exhausted.',
      );
    }

    // Atomic consumption to eliminate concurrent replay race conditions
    const consumed = await VerificationChallenge.findOneAndUpdate(
      {
        _id: challenge._id,
        status: 'pending',
        attempts: { $lt: challenge.maxAttempts },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: 'verified',
          consumedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!consumed) {
      throw new Error('Verification challenge has already been verified or expired.');
    }

    // Security check: If authenticated user calls verify on a challenge bound to another user
    if (userId && challenge.userId && challenge.userId.toString() !== userId) {
      throw new Error('Verification challenge does not belong to the current authenticated user.');
    }

    // If userId provided or bound to challenge, update User model
    const targetUserId = userId || (challenge.userId ? challenge.userId.toString() : undefined);
    if (targetUserId && mongoose.isValidObjectId(targetUserId)) {
      const updateData: Record<string, unknown> = {};
      if (challenge.channel === 'email') {
        updateData.isEmailVerified = true;
        updateData.emailVerifiedAt = new Date();
      } else if (challenge.channel === 'sms') {
        updateData.isPhoneVerified = true;
        updateData.phoneVerifiedAt = new Date();
      }
      await User.findByIdAndUpdate(targetUserId, { $set: updateData });
    }

    return {
      verified: true,
      message: `${challenge.channel === 'email' ? 'Email' : 'Phone'} verified successfully.`,
      channel: challenge.channel,
      purpose: challenge.purpose,
    };
  }
}
