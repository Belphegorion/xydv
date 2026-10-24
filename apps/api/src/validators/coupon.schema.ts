import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z
    .object({
      code: z
        .string()
        .min(3, 'Code must be at least 3 characters')
        .max(30, 'Code cannot exceed 30 characters')
        .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().positive('Discount value must be greater than zero'),
      presetTier: z.enum(['10', '20', '50', 'custom']).optional(),
      maxDiscountAmount: z.number().positive('Maximum discount cap must be positive').optional(),
      minOrderAmount: z.number().min(0, 'Minimum order amount cannot be negative').default(0),
      excludeSaleItems: z.boolean().default(false),
      startDate: z.string().datetime().or(z.string().min(1)),
      endDate: z.string().datetime().or(z.string().min(1)),
      maxRedemptions: z
        .number()
        .int('Max redemptions must be an integer')
        .positive('Max redemptions must be positive'),
      maxRedemptionsPerUser: z
        .number()
        .int('Max redemptions per user must be an integer')
        .positive('Max redemptions per user must be positive')
        .default(1),
      applicableCategories: z.array(z.string()).optional(),
      applicableProducts: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        // Stakeholder Decision A2: 50% discount strictly mandates a maxDiscountAmount
        if (data.discountType === 'percentage' && data.discountValue === 50) {
          return typeof data.maxDiscountAmount === 'number' && data.maxDiscountAmount > 0;
        }
        return true;
      },
      {
        message:
          'A maximum discount cap (in ₹) is mandatory for 50% discount coupons to protect store margins',
        path: ['maxDiscountAmount'],
      },
    )
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Coupon ID is required'),
  }),
  body: z
    .object({
      code: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[A-Z0-9_-]+$/)
        .optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.number().positive().optional(),
      presetTier: z.enum(['10', '20', '50', 'custom']).optional(),
      maxDiscountAmount: z.number().positive().optional(),
      minOrderAmount: z.number().min(0).optional(),
      excludeSaleItems: z.boolean().optional(),
      startDate: z.string().datetime().or(z.string().min(1)).optional(),
      endDate: z.string().datetime().or(z.string().min(1)).optional(),
      maxRedemptions: z.number().int().positive().optional(),
      maxRedemptionsPerUser: z.number().int().positive().optional(),
      status: z.enum(['active', 'inactive', 'expired', 'depleted']).optional(),
      applicableCategories: z.array(z.string()).optional(),
      applicableProducts: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        if (data.discountType === 'percentage' && data.discountValue === 50) {
          return typeof data.maxDiscountAmount === 'number' && data.maxDiscountAmount > 0;
        }
        return true;
      },
      {
        message:
          'A maximum discount cap (in ₹) is mandatory for 50% discount coupons to protect store margins',
        path: ['maxDiscountAmount'],
      },
    )
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
      },
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      },
    ),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').trim(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          sku: z.string().optional(),
          variantId: z.string().optional(),
          quantity: z.number().int().positive('Quantity must be a positive integer'),
          price: z.number().positive('Price must be greater than zero'),
        }),
      )
      .min(1, 'At least one item is required in the cart'),
    guestEmail: z.string().email('Invalid email address').optional(),
  }),
});
