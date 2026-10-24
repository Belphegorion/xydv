import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Notification, type INotificationDoc } from '../models/Notification.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middleware/errorHandler';
import { UPLOADS_DIR } from '../middleware/upload';
import logger from '../config/logger';

let cachedActiveNotifications: INotificationDoc[] | null = null;
let lastActiveFetch = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds TTL

export function invalidateNotificationCache(): void {
  cachedActiveNotifications = null;
  lastActiveFetch = 0;
}

async function recordAudit(
  adminId: string | undefined,
  action: string,
  targetId: string,
  details?: Record<string, unknown>,
) {
  if (!adminId) return;
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType: 'Notification',
      targetId,
      details,
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to record notification audit log:', { error: err });
  }
}

export class NotificationService {
  /**
   * Public storefront cached active notifications retrieval.
   */
  async getActiveNotifications(): Promise<INotificationDoc[]> {
    const now = Date.now();
    if (cachedActiveNotifications && now - lastActiveFetch < CACHE_TTL_MS) {
      return cachedActiveNotifications;
    }

    const nowDate = new Date();
    const notifications = await Notification.find({
      isActive: true,
      startDate: { $lte: nowDate },
      endDate: { $gte: nowDate },
    }).sort({ priority: -1, createdAt: -1 });

    cachedActiveNotifications = notifications;
    lastActiveFetch = now;
    return cachedActiveNotifications;
  }

  /**
   * Lightweight fire-and-forget telemetry counter increment.
   */
  async recordTelemetry(
    id: string,
    event: 'impression' | 'click' | 'dismissal' | 'dismiss',
  ): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) {
      return false;
    }

    const fieldMap: Record<string, string> = {
      impression: 'metrics.impressions',
      click: 'metrics.clicks',
      dismissal: 'metrics.dismissals',
      dismiss: 'metrics.dismissals',
    };

    const field = fieldMap[event];
    if (!field) return false;

    const result = await Notification.findByIdAndUpdate(id, {
      $inc: { [field]: 1 },
    });

    return Boolean(result);
  }

  /**
   * Admin paginated notification listings.
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
    format?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const now = new Date();

    const filter: Record<string, unknown> = {};

    if (params.status) {
      if (params.status === 'active') {
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
      } else if (params.status === 'scheduled') {
        filter.isActive = true;
        filter.startDate = { $gt: now };
      } else if (params.status === 'expired') {
        filter.endDate = { $lt: now };
      } else if (params.status === 'inactive') {
        filter.isActive = false;
      }
    }

    if (params.format && ['modal', 'toast'].includes(params.format)) {
      filter.displayFormat = params.format;
    }

    if (params.search) {
      const regex = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { message: regex }, { couponCode: regex }];
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single notification by ID.
   */
  async getNotificationById(id: string): Promise<INotificationDoc> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Notification not found', 404);
    }
    const notif = await Notification.findById(id);
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }
    return notif;
  }

  /**
   * Create a new notification.
   */
  async createNotification(
    data: Partial<INotificationDoc>,
    adminId?: string,
  ): Promise<INotificationDoc> {
    const doc = await Notification.create({
      ...data,
      createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
    });

    invalidateNotificationCache();
    await recordAudit(adminId, 'CREATE_NOTIFICATION', doc._id.toString(), {
      title: doc.title,
      format: doc.displayFormat,
    });

    return doc;
  }

  /**
   * Update an existing notification.
   */
  async updateNotification(
    id: string,
    data: Partial<INotificationDoc>,
    adminId?: string,
  ): Promise<INotificationDoc> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Notification not found', 404);
    }

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new AppError('Notification not found', 404);
    }

    invalidateNotificationCache();
    await recordAudit(adminId, 'UPDATE_NOTIFICATION', id, {
      title: updated.title,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Toggle isActive state.
   */
  async toggleActive(id: string, adminId?: string): Promise<INotificationDoc> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Notification not found', 404);
    }

    const existing = await Notification.findById(id);
    if (!existing) {
      throw new AppError('Notification not found', 404);
    }

    existing.isActive = !existing.isActive;
    await existing.save();

    invalidateNotificationCache();
    await recordAudit(adminId, 'TOGGLE_NOTIFICATION_ACTIVE', id, {
      isActive: existing.isActive,
    });

    return existing;
  }

  /**
   * Delete a notification and purge local uploaded image if applicable.
   */
  async deleteNotification(id: string, adminId?: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Notification not found', 404);
    }

    const notif = await Notification.findById(id);
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }

    // Clean up local image if stored in uploads directory
    if (notif.imageUrl && notif.imageUrl.includes('/uploads/')) {
      try {
        const filename = notif.imageUrl.split('/uploads/').pop();
        if (filename) {
          const filePath = path.join(UPLOADS_DIR, filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        logger.warn('Failed to clean up notification image file:', { error: err });
      }
    }

    await Notification.deleteOne({ _id: id });
    invalidateNotificationCache();

    await recordAudit(adminId, 'DELETE_NOTIFICATION', id, {
      title: notif.title,
    });

    return true;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
