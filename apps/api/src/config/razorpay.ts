import Razorpay from 'razorpay';
import env from './env';

export const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
export const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
export const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;

if (
  env.NODE_ENV === 'production' &&
  (RAZORPAY_KEY_ID === 'rzp_test_vertex_key' || RAZORPAY_KEY_SECRET === 'vertex_test_secret')
) {
  console.warn(
    '⚠️  [SECURITY WARNING] RAZORPAY credentials are using default test placeholders in production mode!',
  );
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export default razorpay;
