/**
 * Verification & OTP Domain Types
 */

export type VerificationChannel = 'email' | 'sms';

export type VerificationPurpose =
  | 'signup'
  | 'change_email'
  | 'change_phone'
  | 'checkout'
  | 'tracking';

export interface VerificationChallenge {
  _id?: string;
  id?: string;
  userId?: string;
  channel: VerificationChannel;
  purpose: VerificationPurpose;
  targetMasked: string;
  cooldownSeconds?: number;
  expiresAt: string | Date;
  status: 'pending' | 'verified' | 'exhausted' | 'expired';
}

export interface UserVerificationStatus {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  email?: string;
  phone?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
}

export interface VerificationSendResponse {
  success: boolean;
  challengeId: string;
  targetMasked: string;
  cooldownSeconds: number;
  expiresAt: string;
}

export interface VerificationVerifyResponse {
  success: boolean;
  message: string;
  verified: boolean;
  channel: VerificationChannel;
  purpose: VerificationPurpose;
}
