import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z
    .number({
      invalid_type_error: 'Quantity must be a positive integer',
      required_error: 'Quantity must be a positive integer',
    })
    .int('Quantity must be a positive integer')
    .positive('Quantity must be a positive integer'),
});

const shippingAddressSchema = z
  .object({
    fullName: z.string().optional(),
    name: z.string().optional(),
    line1: z.string().optional(),
    street: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().default('IN'),
    phone: z.string().optional(),
    email: z.string().optional(),
  })
  .optional();

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
    shippingAddress: shippingAddressSchema,
    customerEmail: z.string().optional(),
    email: z.string().optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().optional(),
    razorpayOrderId: z
      .string({ required_error: 'Missing payment verification parameters' })
      .min(1, 'Missing payment verification parameters'),
    razorpayPaymentId: z
      .string({ required_error: 'Missing payment verification parameters' })
      .min(1, 'Missing payment verification parameters'),
    razorpaySignature: z
      .string({ required_error: 'Missing payment verification parameters' })
      .min(1, 'Missing payment verification parameters'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], {
      errorMap: () => ({
        message:
          'Invalid order status. Must be pending, confirmed, shipped, delivered, or cancelled.',
      }),
    }),
    trackingNumber: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});
