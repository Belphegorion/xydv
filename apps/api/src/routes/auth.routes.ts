import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateRequest(registerSchema),
  authController.register.bind(authController),
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema),
  authController.login.bind(authController),
);

// POST /api/auth/refresh — Rotate refresh token using secure cookie or body
router.post(
  '/refresh',
  authLimiter,
  validateRequest(refreshSchema),
  authController.refresh.bind(authController),
);

// POST /api/auth/forgot-password — Request password reset token
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

// POST /api/auth/reset-password — Reset password with token
router.post(
  '/reset-password',
  authLimiter,
  validateRequest(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);

// POST /api/auth/logout — Invalidate refresh token and clear cookie
router.post('/logout', authController.logout.bind(authController));

// GET /api/auth/me — Get authenticated user
router.get('/me', requireAuth, authController.me.bind(authController));

export default router;
