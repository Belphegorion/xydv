import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Ephemeral random secrets for local dev only — rotate on every restart.
// In production these MUST be set via environment variables.
const _devJwtSecret = crypto.randomBytes(32).toString('hex');
const _devRefreshSecret = crypto.randomBytes(32).toString('hex');

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/xydv'),
  JWT_SECRET: z.string().default(_devJwtSecret),
  JWT_REFRESH_SECRET: z.string().default(_devRefreshSecret),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_EXPIRE: z.string().default('30d'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_xydv_key'),
  RAZORPAY_KEY_SECRET: z.string().default('xydv_test_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('xydv_webhook_secret'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  OTP_PEPPER: z.string().default('xydv-default-secure-otp-pepper-2026'),
  IP_SALT: z.string().default('xydv-telemetry-salt'),
  AWS_REGION: z.string().default('ap-south-1'),
  SES_FROM_EMAIL: z.string().optional(),
  DLT_ENTITY_ID: z.string().optional(),
  DLT_TEMPLATE_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Fatal: Invalid environment configuration in production');
  }
}

// Production check: Halt startup if unedited template placeholders are detected
if (process.env.NODE_ENV === 'production') {
  const isTemplatePlaceholder = (val?: string) =>
    val &&
    (val.includes('<generate') ||
      val.includes('placeholder') ||
      val === 'your_jwt_secret_here');

  if (
    isTemplatePlaceholder(process.env.JWT_SECRET) ||
    isTemplatePlaceholder(process.env.JWT_REFRESH_SECRET) ||
    isTemplatePlaceholder(process.env.OTP_PEPPER) ||
    isTemplatePlaceholder(process.env.IP_SALT)
  ) {
    throw new Error(
      'Fatal: Default placeholder secrets detected in production. You must configure secure values.',
    );
  }

  if (!process.env.OTP_PEPPER || process.env.OTP_PEPPER === 'xydv-default-secure-otp-pepper-2026') {
    console.warn(
      '⚠️ [SECURITY NOTICE] OTP_PEPPER is unset or using default pepper. Configure a high-entropy secret in production.',
    );
  }

  if (
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET === 'xydv_test_secret' ||
    process.env.RAZORPAY_KEY_SECRET === 'vertex_test_secret'
  ) {
    console.warn(
      '⚠️ [PAYMENT NOTICE] RAZORPAY_KEY_SECRET is configured with test mode or default key. Checkout will operate in test mode.',
    );
  }
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...process.env,
      PORT: process.env.PORT || '5000',
      NODE_ENV: process.env.NODE_ENV || 'development',
    });

export default env;
