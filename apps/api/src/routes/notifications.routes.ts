import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { validateRequest } from '../middleware/validateRequest';
import { notificationTelemetrySchema } from '../validators/notification.schema';

const router = Router();

// GET /api/notifications/active — Public cached active notifications (60s TTL)
router.get('/active', notificationController.getActive.bind(notificationController));

// POST /api/notifications/:id/telemetry — Public fire-and-forget telemetry beacon
router.post(
  '/:id/telemetry',
  validateRequest(notificationTelemetrySchema),
  notificationController.recordTelemetry.bind(notificationController),
);

export default router;
