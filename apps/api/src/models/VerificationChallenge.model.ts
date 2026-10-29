import mongoose, { type Document, type Model } from 'mongoose';
import type { VerificationChannel, VerificationPurpose } from '@vertex/types';

export interface IVerificationChallenge extends Document {
  userId?: mongoose.Types.ObjectId;
  channel: VerificationChannel;
  purpose: VerificationPurpose;
  targetHash: string;
  targetMasked: string;
  codeHash: string;
  tokenHash?: string;
  attempts: number;
  maxAttempts: number;
  sendCount: number;
  lastSentAt: Date;
  expiresAt: Date;
  consumedAt?: Date;
  ipHash: string;
  status: 'pending' | 'verified' | 'exhausted' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const verificationChallengeSchema = new mongoose.Schema<IVerificationChallenge>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    purpose: {
      type: String,
      enum: ['signup', 'change_email', 'change_phone', 'checkout', 'tracking'],
      required: true,
    },
    targetHash: { type: String, required: true, index: true },
    targetMasked: { type: String, required: true },
    codeHash: { type: String, required: true },
    tokenHash: { type: String, sparse: true, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    sendCount: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumedAt: { type: Date },
    ipHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'exhausted', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

verificationChallengeSchema.index({ targetHash: 1, purpose: 1, status: 1 });
verificationChallengeSchema.index({ userId: 1, purpose: 1, status: 1 });

export const VerificationChallenge: Model<IVerificationChallenge> =
  mongoose.model<IVerificationChallenge>('VerificationChallenge', verificationChallengeSchema);
