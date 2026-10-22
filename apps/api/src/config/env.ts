import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/vertex'),
  JWT_SECRET: z.string().default('fnO7dehu28m0xLpQoi7yXG5GdjJYY7ZI84T5pUUGy3j'),
  JWT_REFRESH_SECRET: z.string().default('4044plbw7MAxaHGi1KJAsOrKttSRaTqP18QNxH2IzoE'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_EXPIRE: z.string().default('30d'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_xydv_key'),
  RAZORPAY_KEY_SECRET: z.string().default('xydv_test_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('xydv_webhook_secret'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Fatal: Invalid environment configuration in production');
  }
}

const DEFAULT_PLACEHOLDERS = {
  JWT_SECRET: 'fnO7dehu28m0xLpQoi7yXG5GdjJYY7ZI84T5pUUGy3j',
  JWT_REFRESH_SECRET: '4044plbw7MAxaHGi1KJAsOrKttSRaTqP18QNxH2IzoE',
  RAZORPAY_KEY_SECRET: 'xydv_test_secret',
  RAZORPAY_WEBHOOK_SECRET: 'xydv_webhook_secret',
};

if (process.env.NODE_ENV === 'production') {
  const usingDefaultJwt =
    !process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_PLACEHOLDERS.JWT_SECRET;
  const usingDefaultRefresh =
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET === DEFAULT_PLACEHOLDERS.JWT_REFRESH_SECRET;
  const usingDefaultRazorpay =
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET === DEFAULT_PLACEHOLDERS.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET === 'vertex_test_secret';

  if (usingDefaultJwt || usingDefaultRefresh || usingDefaultRazorpay) {
    throw new Error(
      'Fatal: Default placeholder secrets detected in production. You must configure secure values.',
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
