import type { Request, Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { User } from '../models/User.model';

export class VerificationController {
  public static async send(req: Request, res: Response): Promise<void> {
    try {
      const { channel, target, purpose } = req.body;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userId = req.user?._id;

      const result = await VerificationService.sendVerification({
        channel,
        target,
        purpose,
        userId,
        ip,
      });

      // Anti-enumeration: returns identical success structure
      res.status(200).json({
        success: true,
        challengeId: result.challengeId,
        targetMasked: result.targetMasked,
        cooldownSeconds: result.cooldownSeconds,
        expiresAt: result.expiresAt,
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code.';
      res.status(400).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  public static async verify(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId, code, token } = req.body;
      const userId = req.user?._id;

      const result = await VerificationService.verifyChallenge({
        challengeId,
        code,
        token,
        userId,
      });

      res.status(200).json({
        success: true,
        verified: result.verified,
        channel: result.channel,
        purpose: result.purpose,
        message: result.message,
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed.';
      res.status(400).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  public static async status(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          isEmailVerified: Boolean(user.isEmailVerified),
          emailVerifiedAt: user.emailVerifiedAt,
          phone: user.phone,
          isPhoneVerified: Boolean(user.isPhoneVerified),
          phoneVerifiedAt: user.phoneVerifiedAt,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve verification status.';
      res.status(500).json({ success: false, message, error: message });
    }
  }
}
