import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { orderLimiter } from '../middleware/rateLimiter';
import { createOrderSchema, verifyPaymentSchema, orderIdParamSchema } from '../validators/order.schema';

const router = Router();

// POST /api/orders/razorpay/create-order — Razorpay order generation with server-side price authority
router.post(
  '/razorpay/create-order',
  orderLimiter,
  validateRequest(createOrderSchema),
  orderController.createRazorpayOrder.bind(orderController),
);

// Aliases for compatibility with earlier milestones & simulators
router.post(
  '/create-order',
  orderLimiter,
  validateRequest(createOrderSchema),
  orderController.createRazorpayOrder.bind(orderController),
);
router.post(
  '/create-payment-intent',
  orderLimiter,
  validateRequest(createOrderSchema),
  orderController.createRazorpayOrder.bind(orderController),
);

// POST /api/orders/razorpay/verify-payment — Payment verification with timing-safe HMAC & length check
router.post(
  '/razorpay/verify-payment',
  validateRequest(verifyPaymentSchema),
  orderController.verifyPayment.bind(orderController),
);

// POST /api/orders — Direct authenticated order placement with inventory guard
router.post(
  '/',
  requireAuth,
  validateRequest(createOrderSchema),
  orderController.createDirectOrder.bind(orderController),
);

// GET /api/orders — List user's orders
router.get(
  '/',
  requireAuth,
  orderController.getUserOrders.bind(orderController),
);

// GET /api/orders/:id — Fetch specific order
router.get(
  '/:id',
  requireAuth,
  validateRequest(orderIdParamSchema),
  orderController.getOrderById.bind(orderController),
);

export default router;
