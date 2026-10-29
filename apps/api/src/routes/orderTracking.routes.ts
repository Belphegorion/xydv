import { Router } from 'express';
import { OrderTrackingController } from '../controllers/orderTracking.controller';
import { validateRequest } from '../middleware/validateRequest';
import { requireAdmin, optionalAuth } from '../middleware/auth';
import { updateOrderStatusTrackingSchema } from '../validators/orderTracking.schema';

const router = Router();

// Customer and Guest timeline retrieval
router.get('/:orderId/timeline', optionalAuth, OrderTrackingController.getTimeline);
router.get('/:id/timeline', optionalAuth, OrderTrackingController.getTimeline);

// Real-Time Server-Sent Events stream
router.get('/:orderId/stream', optionalAuth, OrderTrackingController.streamOrder);
router.get('/:id/stream', optionalAuth, OrderTrackingController.streamOrder);

// Admin-managed status transitions
router.post(
  '/:orderId/status',
  requireAdmin,
  validateRequest(updateOrderStatusTrackingSchema),
  OrderTrackingController.updateStatus,
);
router.post(
  '/:id/status',
  requireAdmin,
  validateRequest(updateOrderStatusTrackingSchema),
  OrderTrackingController.updateStatus,
);

export default router;
