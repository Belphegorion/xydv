import { z } from 'zod';

export const updateOrderStatusTrackingSchema = z.object({
  params: z
    .object({
      orderId: z.string().min(1).optional(),
      id: z.string().min(1).optional(),
    })
    .optional(),
  body: z.object({
    status: z.enum([
      'pending',
      'placed',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ]),
    carrier: z.string().max(100).optional(),
    trackingNumber: z.string().max(100).optional(),
    trackingUrl: z.string().url().max(500).optional(),
    estimatedDelivery: z.string().optional(),
    note: z.string().max(500).optional(),
    visibility: z.enum(['customer', 'internal']).optional(),
  }),
});

export const orderTrackingParamSchema = z.object({
  params: z
    .object({
      orderId: z.string().min(1).optional(),
      id: z.string().min(1).optional(),
    })
    .optional(),
  query: z
    .object({
      email: z.string().optional(),
      token: z.string().optional(),
    })
    .optional(),
});
