import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { validateRequest } from '../middleware/validateRequest';
import { couponLimiter } from '../middleware/rateLimiter';
import { validateCouponSchema } from '../validators/coupon.schema';

const router = Router();

// POST /api/coupons/validate — Public rate-limited coupon code validation and price preview
router.post(
  '/validate',
  couponLimiter,
  validateRequest(validateCouponSchema),
  couponController.validate.bind(couponController),
);

export default router;
