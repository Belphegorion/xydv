import type { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { type AuthRequest, getAuthenticatedUser } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const user = await userService.getProfile(String(authUser._id));
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const user = await userService.updateProfile(String(authUser._id), req.body);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async addAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const addresses = await userService.addAddress(String(authUser._id), req.body);
      res.status(201).json({
        success: true,
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const id = getParam(req.params.id);
      const addresses = await userService.deleteAddress(String(authUser._id), id);
      res.json({
        success: true,
        message: 'Address removed successfully',
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
export default userController;
