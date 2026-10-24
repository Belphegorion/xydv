import { z } from 'zod';

export const createDiscountSchema = z.object({
  body: z
    .object({
      name: z.string().min(3, 'Name must be at least 3 characters').max(120),
      description: z.string().max(500).optional(),
      scope: z.enum(['product', 'category', 'catalog']),
      targetProductIds: z.array(z.string()).optional(),
      targetCategories: z.array(z.string()).optional(),
      type: z.enum(['percentage', 'fixed_amount', 'set_price']),
      value: z.number().positive('Discount value must be greater than zero'),
      priceFloorPaise: z.number().min(0).default(29900), // Default ₹299
      maxDiscountCapPaise: z.number().min(0).optional(),
      excludedProductIds: z.array(z.string()).optional(),
      excludedCategories: z.array(z.string()).optional(),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().optional(),
      status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).default('draft'),
      priority: z.number().int().default(0),
      badgeLabel: z.string().max(30).optional(),
      allowCouponStacking: z.boolean().default(false),
      maxCombinedDiscountPercent: z.number().min(10).max(70).default(50),
    })
    .refine(
      (data) => {
        // Percentage discounts cannot exceed 70%
        if (data.type === 'percentage') {
          return data.value <= 70;
        }
        return true;
      },
      {
        message: 'Percentage discounts cannot exceed 70% to protect store margins',
        path: ['value'],
      },
    )
    .refine(
      (data) => {
        // Product scope requires at least one target product
        if (data.scope === 'product') {
          return Array.isArray(data.targetProductIds) && data.targetProductIds.length > 0;
        }
        return true;
      },
      {
        message: 'Product scope requires at least one target product to be selected',
        path: ['targetProductIds'],
      },
    )
    .refine(
      (data) => {
        // Category scope requires at least one target category
        if (data.scope === 'category') {
          return Array.isArray(data.targetCategories) && data.targetCategories.length > 0;
        }
        return true;
      },
      {
        message: 'Category scope requires at least one target category to be selected',
        path: ['targetCategories'],
      },
    )
    .refine(
      (data) => {
        // Catalog scope requires an end date (max 30 days) to prevent permanent sales
        if (data.scope === 'catalog') {
          return typeof data.endDate === 'string' && data.endDate.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Catalog-wide discounts strictly mandate an end date to prevent perpetual sales',
        path: ['endDate'],
      },
    )
    .refine(
      (data) => {
        if (data.endDate && data.startDate) {
          return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
      },
      {
        message: 'End date must be strictly after start date',
        path: ['endDate'],
      },
    ),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Discount ID is required'),
  }),
  body: z.object({
    name: z.string().min(3).max(120).optional(),
    description: z.string().max(500).optional(),
    scope: z.enum(['product', 'category', 'catalog']).optional(),
    targetProductIds: z.array(z.string()).optional(),
    targetCategories: z.array(z.string()).optional(),
    type: z.enum(['percentage', 'fixed_amount', 'set_price']).optional(),
    value: z.number().positive().optional(),
    priceFloorPaise: z.number().min(0).optional(),
    maxDiscountCapPaise: z.number().min(0).optional(),
    excludedProductIds: z.array(z.string()).optional(),
    excludedCategories: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).optional(),
    priority: z.number().int().optional(),
    badgeLabel: z.string().max(30).optional(),
    allowCouponStacking: z.boolean().optional(),
    maxCombinedDiscountPercent: z.number().min(10).max(70).optional(),
  }),
});

export const discountIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Discount ID is required'),
  }),
});

export const discountPreviewSchema = z.object({
  body: z.object({
    scope: z.enum(['product', 'category', 'catalog']),
    targetProductIds: z.array(z.string()).optional(),
    targetCategories: z.array(z.string()).optional(),
    type: z.enum(['percentage', 'fixed_amount', 'set_price']),
    value: z.number().positive(),
    priceFloorPaise: z.number().min(0).default(29900),
    maxDiscountCapPaise: z.number().min(0).optional(),
    excludedProductIds: z.array(z.string()).optional(),
    excludedCategories: z.array(z.string()).optional(),
    badgeLabel: z.string().max(30).optional(),
  }),
});

export const discountQuerySchema = z.object({
  query: z
    .object({
      status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).optional(),
      scope: z.enum(['product', 'category', 'catalog']).optional(),
      search: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});
