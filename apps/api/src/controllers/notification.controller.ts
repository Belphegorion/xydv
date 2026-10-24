import type { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import type { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export class NotificationController {
  async getActive(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationService.getActiveNotifications();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async recordTelemetry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const { event } = req.body;
      await notificationService.recordTelemetry(id, event);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getAdminNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const rawStatus = typeof req.query.status === 'string' ? req.query.status : '';
      const status =
        rawStatus === 'active' ||
        rawStatus === 'scheduled' ||
        rawStatus === 'expired' ||
        rawStatus === 'inactive' ||
        rawStatus === 'all'
          ? rawStatus
          : undefined;
      const format = typeof req.query.format === 'string' ? req.query.format : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const result = await notificationService.getNotifications({
        page,
        limit,
        status,
        format,
        search,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotificationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const data = await notificationService.getNotificationById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const data = await notificationService.createNotification(req.body, adminId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const data = await notificationService.updateNotification(id, req.body, adminId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      await notificationService.deleteNotification(id, adminId);
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async toggleActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const adminId = req.user?._id ? String(req.user._id) : undefined;
      const data = await notificationService.toggleActive(id, adminId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
