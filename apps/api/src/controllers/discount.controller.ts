import type { Request, Response, NextFunction } from 'express';
import { discountService } from '../services/discount.service';
import type { AuthRequest } from '../middleware/auth';

export class DiscountController {
  async createDiscount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const discount = await discountService.createDiscount(req.body, adminId, req.ip);
      res.status(201).json({
        success: true,
        data: discount,
        message: 'Discount created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDiscount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const discount = await discountService.updateDiscount(id, req.body, adminId, req.ip);
      res.json({
        success: true,
        data: discount,
        message: 'Discount updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async togglePause(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const discount = await discountService.togglePause(id, adminId, req.ip);
      res.json({
        success: true,
        data: discount,
        message: `Discount ${discount.status === 'paused' ? 'paused' : 'resumed'} successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  async endDiscount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const discount = await discountService.endDiscount(id, adminId, req.ip);
      res.json({
        success: true,
        data: discount,
        message: 'Discount ended successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async previewDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preview = await discountService.previewDiscount(req.body);
      res.json({
        success: true,
        data: preview,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discountService.getDiscounts(req.query as Record<string, string>);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDiscountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const discount = await discountService.getDiscountById(id);
      res.json({
        success: true,
        data: discount,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await discountService.getAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async recomputeAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discountService.recomputeAllProductPrices();
      res.json({
        success: true,
        data: result,
        message: `Successfully recomputed effective prices for ${result.updated} products`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const discountController = new DiscountController();
