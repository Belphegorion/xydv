import type { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import type { AuthRequest } from '../middleware/auth';

export class ProductController {
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProducts(req.query as Record<string, string>);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const product = await productService.getProductBySlug(slug);
      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const reviews = await productService.getProductReviews(slug);
      res.json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  }

  async createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const review = await productService.createReview(
        slug,
        String(req.user!._id),
        req.body.userName,
        req.body,
      );
      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
export default productController;
