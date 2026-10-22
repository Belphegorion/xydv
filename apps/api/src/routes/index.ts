import { Router } from 'express';
import productRoutes from './products.routes';
import authRoutes from './auth.routes';
import orderRoutes from './orders.routes';
import userRoutes from './users.routes';
import adminRoutes from './admin.routes';
import webhookRoutes from './webhooks.routes';
import settingsRoutes from './settings.routes';
import supportRoutes from './support.routes';

export const apiRouter = Router();

apiRouter.use('/products', productRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/support', supportRoutes);
