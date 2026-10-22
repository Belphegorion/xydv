import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { getFileUrl } from '../middleware/upload';
import type { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export class AdminController {
  // --- PRODUCTS ---
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getProducts(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const product = await adminService.getProductById(id);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as AuthRequest).user?._id;
      const product = await adminService.createProduct(req.body, adminId, req.ip);
      res.status(201).json({ data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = (req as AuthRequest).user?._id;
      const product = await adminService.updateProduct(id, req.body, adminId, req.ip);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = (req as AuthRequest).user?._id;
      const result = await adminService.deleteProduct(id, adminId, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // --- CATEGORIES ---
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await adminService.getCategories();
      res.json({ data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as AuthRequest).user?._id;
      const category = await adminService.createCategory(req.body, adminId, req.ip);
      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = (req as AuthRequest).user?._id;
      const category = await adminService.updateCategory(id, req.body, adminId, req.ip);
      res.json({ data: category });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = (req as AuthRequest).user?._id;
      const result = await adminService.deleteCategory(id, adminId, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // --- ORDERS ---
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getOrders(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const order = await adminService.getOrderById(id);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const { status, trackingNumber } = req.body;
      const adminId = (req as AuthRequest).user?._id;
      const order = await adminService.updateOrderStatus(id, status, trackingNumber, adminId, req.ip);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }

  async refundOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const { reason, amount } = req.body;
      const adminId = (req as AuthRequest).user?._id;
      const order = await adminService.refundOrder(id, reason, adminId, req.ip, amount);
      res.json({ data: order, message: 'Refund issued successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- INVENTORY ---
  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getInventory(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateVariantStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = getParam(req.params.productId);
      const sku = getParam(req.params.sku);
      const { stock } = req.body;
      const adminId = (req as AuthRequest).user?._id;
      const result = await adminService.updateVariantStock(productId, sku, Number(stock), adminId, req.ip);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 5;
      const result = await adminService.getLowStockAlerts(threshold);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // --- CUSTOMERS ---
  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getCustomers(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const customer = await adminService.getCustomerById(id);
      res.json({ data: customer });
    } catch (err) {
      next(err);
    }
  }

  async updateCustomerRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const { role } = req.body;
      const currentAdminId = (req as AuthRequest).user?._id;
      const result = await adminService.updateCustomerRole(id, role, currentAdminId, req.ip);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async toggleBlockCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const { isBlocked } = req.body;
      const currentAdminId = (req as AuthRequest).user?._id;
      const result = await adminService.toggleBlockCustomer(id, Boolean(isBlocked), currentAdminId, req.ip);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // --- ANALYTICS ---
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as '7d' | '30d' | 'all') || '30d';
      const analytics = await adminService.getAnalytics(period);
      res.json({ data: analytics });
    } catch (err) {
      next(err);
    }
  }

  // --- FILE UPLOADS ---
  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;

      const allFiles = files && files.length > 0 ? files : file ? [file] : [];
      if (allFiles.length === 0) {
        res.status(400).json({ message: 'No images provided' });
        return;
      }

      const host = `${req.protocol}://${req.get('host')}`;
      const urls = await Promise.all(allFiles.map((f) => getFileUrl(f, host)));

      res.status(201).json({
        data: {
          urls,
          count: urls.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // --- PAGE VIEW TRACKING ---
  async trackPageView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path: pagePath, referrer } = req.body;
      if (!pagePath) {
        res.status(400).json({ message: 'Path is required' });
        return;
      }
      await adminService.trackPageView({
        path: pagePath,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        referrer,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // --- SETTINGS ---
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSettings();
      res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as AuthRequest).user?._id;
      const settings = await adminService.updateSettings(req.body, adminId, req.ip);
      res.json({ data: settings, message: 'Settings updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
