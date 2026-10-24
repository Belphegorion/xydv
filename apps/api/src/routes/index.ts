import { Router } from 'express';
import productRoutes from './products.routes';
import authRoutes from './auth.routes';
import orderRoutes from './orders.routes';
import userRoutes from './users.routes';
import adminRoutes from './admin.routes';
import webhookRoutes from './webhooks.routes';
import settingsRoutes from './settings.routes';
import supportRoutes from './support.routes';
import notificationsRoutes from './notifications.routes';
import couponsRoutes from './coupons.routes';
import { productController } from '../controllers/product.controller';
import { adminController } from '../controllers/admin.controller';
import { trackViewSchema } from '../validators/admin.schema';
import { validateRequest } from '../middleware/validateRequest';

export const apiRouter = Router();

apiRouter.use('/products', productRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/support', supportRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/coupons', couponsRoutes);

// Direct public taxonomy and telemetry routes
apiRouter.get('/categories', productController.getCategories.bind(productController));
apiRouter.post(
  '/analytics/track',
  validateRequest(trackViewSchema),
  adminController.trackPageView.bind(adminController),
);
apiRouter.post(
  '/admin/pageviews',
  validateRequest(trackViewSchema),
  adminController.trackPageView.bind(adminController),
);

apiRouter.post('/newsletter', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ success: false, error: 'A valid email address is required.' });
    return;
  }
  res.json({
    success: true,
    message: 'Priority allocation secured. Welcome to the XYDV athlete dispatch list.',
    data: { email, subscribedAt: new Date().toISOString() },
  });
});

