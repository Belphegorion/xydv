import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { validateRequest } from '../middleware/validateRequest';
import { verificationLimiter } from '../middleware/rateLimiter';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  sendVerificationSchema,
  verifyChallengeSchema,
} from '../validators/verification.schema';

const router = Router();

router.post(
  '/send',
  verificationLimiter,
  optionalAuth,
  validateRequest(sendVerificationSchema),
  VerificationController.send,
);

router.post(
  '/verify',
  verificationLimiter,
  optionalAuth,
  validateRequest(verifyChallengeSchema),
  VerificationController.verify,
);

router.get('/status', requireAuth, VerificationController.status);

export default router;
