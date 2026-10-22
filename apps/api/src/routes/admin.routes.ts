import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth';
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

export default router;
