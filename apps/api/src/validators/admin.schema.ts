import { z } from 'zod';

export const adminCreateProductSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, 'Product name is required')
        .max(200)
        .refine((val) => !/<\s*script\b/i.test(val), {
          message: 'Product name cannot contain script tags',
        }),
      slug: z.string().optional(),
      description: z
        .string()
        .min(1, 'Description is required')
        .refine((val) => !/<\s*script\b/i.test(val), {
          message: 'Description cannot contain script tags',
        }),
      category: z.string().min(1, 'Category is required'),
      price: z.number().positive('Price must be greater than 0'),
      compareAt: z.number().positive('Compare price must be greater than 0').optional().nullable(),
      brand: z.string().default('XYDV'),
      tags: z.array(z.string()).optional(),
      specs: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      variants: z
        .array(
          z.object({
            sku: z.string().min(1, 'SKU is required'),
            color: z.string().min(1, 'Color is required'),
            colorHex: z.string().optional().default('#000000'),
            size: z.string().min(1, 'Size is required'),
            price: z.number().min(0),
            stock: z.number().int().min(0),
            reservedStock: z.number().int().min(0).optional(),
            imageUrl: z.string().optional(),
            secondaryImageUrl: z.string().optional(),
          }),
        )
        .optional()
        .refine(
          (items) =>
            !items || new Set(items.map((i) => i.sku.trim().toUpperCase())).size === items.length,
          {
            message: 'Each variant must have a unique SKU code',
          },
        ),
      images: z
        .array(z.union([z.string(), z.object({ url: z.string() }).passthrough()]))
        .optional(),
      inStock: z.boolean().optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      bestseller: z.boolean().optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
      features: z.array(z.string()).optional(),
      materials: z.array(z.string()).optional(),
      sizeChart: z.any().optional(),
      discipline: z.string().optional(),
      gender: z.string().optional(),
    })
    .refine((data) => !data.compareAt || data.compareAt === null || data.compareAt > data.price, {
      message: 'Compare price must be greater than sale price',
      path: ['compareAt'],
    }),
});

export const adminUpdateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
  body: z
    .object({
      name: z
        .string()
        .min(1)
        .max(200)
        .refine((val) => !/<\s*script\b/i.test(val), {
          message: 'Product name cannot contain script tags',
        })
        .optional(),
      slug: z.string().optional(),
      description: z
        .string()
        .min(1)
        .refine((val) => !/<\s*script\b/i.test(val), {
          message: 'Description cannot contain script tags',
        })
        .optional(),
      category: z.string().min(1).optional(),
      price: z.number().positive('Price must be greater than 0').optional(),
      compareAt: z.number().positive('Compare price must be greater than 0').optional().nullable(),
      brand: z.string().optional(),
      tags: z.array(z.string()).optional(),
      specs: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      variants: z
        .array(
          z.object({
            sku: z.string(),
            color: z.string(),
            colorHex: z.string().optional(),
            size: z.string(),
            price: z.number().min(0),
            stock: z.number().int().min(0),
            reservedStock: z.number().int().min(0).optional(),
            imageUrl: z.string().optional(),
            secondaryImageUrl: z.string().optional(),
          }),
        )
        .optional()
        .refine(
          (items) =>
            !items || new Set(items.map((i) => i.sku.trim().toUpperCase())).size === items.length,
          {
            message: 'Each variant must have a unique SKU code',
          },
        ),
      images: z
        .array(z.union([z.string(), z.object({ url: z.string() }).passthrough()]))
        .optional(),
      inStock: z.boolean().optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      bestseller: z.boolean().optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
      features: z.array(z.string()).optional(),
      materials: z.array(z.string()).optional(),
      sizeChart: z.any().optional(),
      discipline: z.string().optional(),
      gender: z.string().optional(),
    })
    .refine(
      (data) =>
        !data.compareAt || data.compareAt === null || !data.price || data.compareAt > data.price,
      {
        message: 'Compare price must be greater than sale price',
        path: ['compareAt'],
      },
    ),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    slug: z.string().optional(),
    description: z.string().max(500).optional(),
    image: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().optional(),
    description: z.string().max(500).optional(),
    image: z.string().optional(),
  }),
});

export const updateVariantStockSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    sku: z.string().min(1, 'Variant SKU is required'),
  }),
  body: z.object({
    stock: z
      .number({
        required_error: 'Stock is required',
        invalid_type_error: 'Stock must be a non-negative integer',
      })
      .int('Stock must be a non-negative integer')
      .min(0, 'Stock must be a non-negative integer'),
  }),
});

export const updateCustomerRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    role: z.enum(['customer', 'admin'], {
      errorMap: () => ({ message: 'Role must be either customer or admin' }),
    }),
  }),
});

export const toggleBlockCustomerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    isBlocked: z.boolean({ required_error: 'isBlocked is required' }),
  }),
});

export const refundOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
    amount: z.number().positive('Refund amount must be positive').optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    freeShippingThreshold: z.number().min(0).optional(),
    standardShippingFee: z.number().min(0).optional(),
    taxRate: z.number().min(0).max(1).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    currency: z.string().optional(),
    currencySymbol: z.string().optional(),
    storeName: z.string().optional(),
    supportEmail: z.string().email().optional(),
  }),
});

export const trackViewSchema = z.object({
  body: z.object({
    path: z.string().min(1, 'Path is required').max(200, 'Path cannot exceed 200 characters'),
    referrer: z.string().max(300, 'Referrer cannot exceed 300 characters').optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Identifier is required'),
  }),
});
