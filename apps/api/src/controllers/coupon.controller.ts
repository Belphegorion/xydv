import type { Response, NextFunction } from 'express';
import { couponService } from '../services/coupon.service';
import type { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export class CouponController {
  async validate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, items, guestEmail } = req.body;
      const userId = req.user?._id ? String(req.user._id) : undefined;
      const data = await couponService.validateCoupon({
        code,
        items,
        userId,
        guestEmail,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async generateCode(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = couponService.generateRandomCode();
      res.json({ success: true, data: { code } });
    } catch (err) {
      next(err);
    }
  }

  async getAdminCoupons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const tier = typeof req.query.tier === 'string' ? req.query.tier : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const result = await couponService.getCoupons({
        page,
        limit,
        status,
        tier,
        search,
      });

      res.json({
        success: true,
        data: result.items,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCouponById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const data = await couponService.getCouponById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const data = await couponService.createCoupon(req.body, adminId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const data = await couponService.updateCoupon(id, req.body, adminId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      await couponService.deleteCoupon(id, adminId);
      res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getRedemptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const result = await couponService.getCouponRedemptions(id, { page, limit });
      res.json({
        success: true,
        data: result.redemptions,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCouponRedemptions(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    return this.getRedemptions(req, res, next);
  }
}

export const couponController = new CouponController();
export default couponController;
