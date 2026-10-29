import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth';
import { Ticket } from '../models/Ticket.model';
import { upload, validateUploadMagicBytes } from '../middleware/upload';
import { validateRequest } from '../middleware/validateRequest';
import {
  adminCreateProductSchema,
  adminUpdateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  updateVariantStockSchema,
  updateCustomerRoleSchema,
  toggleBlockCustomerSchema,
  refundOrderSchema,
  updateSettingsSchema,
  trackViewSchema,
  idParamSchema,
} from '../validators/admin.schema';
import { updateOrderStatusSchema } from '../validators/order.schema';
import { OrderTrackingController } from '../controllers/orderTracking.controller';
import { updateOrderStatusTrackingSchema } from '../validators/orderTracking.schema';
import { notificationController } from '../controllers/notification.controller';
import { couponController } from '../controllers/coupon.controller';
import { discountController } from '../controllers/discount.controller';
import {
  createNotificationSchema,
  updateNotificationSchema,
} from '../validators/notification.schema';
import { createCouponSchema, updateCouponSchema } from '../validators/coupon.schema';
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountPreviewSchema,
  discountQuerySchema,
} from '../validators/discount.schema';

const router = Router();

// Public route for lightweight storefront telemetry tracking
router.post(
  '/track-view',
  validateRequest(trackViewSchema),
  adminController.trackPageView.bind(adminController),
);

// All subsequent admin routes require authenticated admin credentials
router.use(requireAdmin);

// --- FILE UPLOADS ---
router.post(
  '/upload',
  upload.array('images', 10),
  validateUploadMagicBytes,
  adminController.uploadImages.bind(adminController),
);

// --- PRODUCTS ---
router.get('/products', adminController.getProducts.bind(adminController));
router.get(
  '/products/:id',
  validateRequest(idParamSchema),
  adminController.getProductById.bind(adminController),
);
router.post(
  '/products',
  validateRequest(adminCreateProductSchema),
  adminController.createProduct.bind(adminController),
);
router.patch(
  '/products/:id',
  validateRequest(adminUpdateProductSchema),
  adminController.updateProduct.bind(adminController),
);
router.delete(
  '/products/:id',
  validateRequest(idParamSchema),
  adminController.deleteProduct.bind(adminController),
);

// --- CATEGORIES ---
router.get('/categories', adminController.getCategories.bind(adminController));
router.post(
  '/categories',
  validateRequest(createCategorySchema),
  adminController.createCategory.bind(adminController),
);
router.patch(
  '/categories/:id',
  validateRequest(updateCategorySchema),
  adminController.updateCategory.bind(adminController),
);
router.delete(
  '/categories/:id',
  validateRequest(idParamSchema),
  adminController.deleteCategory.bind(adminController),
);

// --- ORDERS ---
router.get('/orders', adminController.getOrders.bind(adminController));
router.get(
  '/orders/:id',
  validateRequest(idParamSchema),
  adminController.getOrderById.bind(adminController),
);
router.patch(
  '/orders/:id/status',
  validateRequest(updateOrderStatusSchema),
  adminController.updateOrderStatus.bind(adminController),
);
router.post(
  '/orders/:id/status',
  validateRequest(updateOrderStatusTrackingSchema),
  OrderTrackingController.updateStatus,
);
router.post(
  '/orders/:orderId/status',
  validateRequest(updateOrderStatusTrackingSchema),
  OrderTrackingController.updateStatus,
);
router.post(
  '/orders/:id/refund',
  validateRequest(refundOrderSchema),
  adminController.refundOrder.bind(adminController),
);

// --- INVENTORY ---
router.get('/inventory', adminController.getInventory.bind(adminController));
router.get('/inventory/low-stock', adminController.getLowStockAlerts.bind(adminController));
router.patch(
  '/inventory/:productId/variants/:sku',
  validateRequest(updateVariantStockSchema),
  adminController.updateVariantStock.bind(adminController),
);

// --- CUSTOMERS ---
router.get('/customers', adminController.getCustomers.bind(adminController));
router.get(
  '/customers/:id',
  validateRequest(idParamSchema),
  adminController.getCustomerById.bind(adminController),
);
router.patch(
  '/customers/:id/role',
  validateRequest(updateCustomerRoleSchema),
  adminController.updateCustomerRole.bind(adminController),
);
router.patch(
  '/customers/:id/block',
  validateRequest(toggleBlockCustomerSchema),
  adminController.toggleBlockCustomer.bind(adminController),
);

// --- ANALYTICS ---
router.get('/analytics', adminController.getAnalytics.bind(adminController));

// --- STORE SETTINGS ---
router.get('/settings', adminController.getSettings.bind(adminController));
router.patch(
  '/settings',
  validateRequest(updateSettingsSchema),
  adminController.updateSettings.bind(adminController),
);

// --- SUPPORT TICKETS ---
router.get('/tickets', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const filter: Record<string, unknown> = {};
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      filter.status = status;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id/status', async (req, res, next) => {
  try {
    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const { status } = req.body ?? {};
    if (!status || !allowedStatuses.includes(String(status))) {
      res.status(400).json({
        success: false,
        error: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
      return;
    }
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: { status: String(status) } },
      { new: true },
    ).lean();
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', notificationController.getAdminNotifications.bind(notificationController));
router.post(
  '/notifications',
  validateRequest(createNotificationSchema),
  notificationController.createNotification.bind(notificationController),
);
router.get(
  '/notifications/:id',
  validateRequest(idParamSchema),
  notificationController.getNotificationById.bind(notificationController),
);
router.patch(
  '/notifications/:id',
  validateRequest(updateNotificationSchema),
  notificationController.updateNotification.bind(notificationController),
);
router.delete(
  '/notifications/:id',
  validateRequest(idParamSchema),
  notificationController.deleteNotification.bind(notificationController),
);
router.patch(
  '/notifications/:id/toggle',
  validateRequest(idParamSchema),
  notificationController.toggleActive.bind(notificationController),
);

// --- COUPONS ---
router.get('/coupons', couponController.getAdminCoupons.bind(couponController));
router.get('/coupons/generate-code', couponController.generateCode.bind(couponController));
router.post(
  '/coupons',
  validateRequest(createCouponSchema),
  couponController.createCoupon.bind(couponController),
);
router.get(
  '/coupons/:id',
  validateRequest(idParamSchema),
  couponController.getCouponById.bind(couponController),
);
router.patch(
  '/coupons/:id',
  validateRequest(updateCouponSchema),
  couponController.updateCoupon.bind(couponController),
);
router.delete(
  '/coupons/:id',
  validateRequest(idParamSchema),
  couponController.deleteCoupon.bind(couponController),
);
router.get(
  '/coupons/:id/redemptions',
  validateRequest(idParamSchema),
  couponController.getRedemptions.bind(couponController),
);

// --- DISCOUNTS (Tiered Promotional Engine) ---
router.get(
  '/discounts',
  validateRequest(discountQuerySchema),
  discountController.getDiscounts.bind(discountController),
);
router.get(
  '/discounts/analytics',
  discountController.getAnalytics.bind(discountController),
);
router.post(
  '/discounts/preview',
  validateRequest(discountPreviewSchema),
  discountController.previewDiscount.bind(discountController),
);
router.post(
  '/discounts/recompute',
  discountController.recomputeAll.bind(discountController),
);
router.post(
  '/discounts',
  validateRequest(createDiscountSchema),
  discountController.createDiscount.bind(discountController),
);
router.get(
  '/discounts/:id',
  validateRequest(idParamSchema),
  discountController.getDiscountById.bind(discountController),
);
router.patch(
  '/discounts/:id',
  validateRequest(updateDiscountSchema),
  discountController.updateDiscount.bind(discountController),
);
router.post(
  '/discounts/:id/pause',
  validateRequest(idParamSchema),
  discountController.togglePause.bind(discountController),
);
router.post(
  '/discounts/:id/end',
  validateRequest(idParamSchema),
  discountController.endDiscount.bind(discountController),
);

export default router;
