import Razorpay from 'razorpay';
import env from './env';
import { logger } from './logger';

export const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
export const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
export const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;

if (env.NODE_ENV !== 'production' && RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
  throw new Error(
    'Fatal: Live Razorpay credentials (rzp_live_*) cannot be used in development or testing. Use rzp_test_* keys.',
  );
}

if (
  env.NODE_ENV === 'production' &&
  (RAZORPAY_KEY_ID === 'rzp_test_xydv_key' ||
    RAZORPAY_KEY_ID === 'rzp_test_vertex_key' ||
    RAZORPAY_KEY_SECRET === 'xydv_test_secret' ||
    RAZORPAY_KEY_SECRET === 'vertex_test_secret')
) {
  logger.warn(
    '⚠️  [SECURITY WARNING] RAZORPAY credentials are using default test placeholders in production mode!',
  );
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export default razorpay;
