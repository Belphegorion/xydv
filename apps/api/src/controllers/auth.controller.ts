import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import type { AuthRequest } from '../middleware/auth';

const REFRESH_COOKIE_NAME = 'xydv_refresh_token';
const LEGACY_REFRESH_COOKIE_NAME = 'vertex_refresh_token';

function setRefreshCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      setRefreshCookie(res, result.refreshToken);
      res.status(201).json({
        data: result.user,
        token: result.token,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      setRefreshCookie(res, result.refreshToken);
      res.json({
        user: result.user,
        data: result.user,
        token: result.token,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.cookies?.[LEGACY_REFRESH_COOKIE_NAME] ||
        req.body?.refreshToken;
      const result = await authService.rotateRefreshToken(token);
      setRefreshCookie(res, result.refreshToken);
      res.json({
        token: result.token,
        data: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.cookies?.[LEGACY_REFRESH_COOKIE_NAME] ||
        req.body?.refreshToken;
      await authService.logout(token);
      res.clearCookie(REFRESH_COOKIE_NAME);
      res.clearCookie(LEGACY_REFRESH_COOKIE_NAME);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!._id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
export default authController;
