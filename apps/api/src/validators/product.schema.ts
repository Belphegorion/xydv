import { z } from 'zod';

export const productQuerySchema = z.object({
  query: z
    .object({
      category: z.string().optional(),
      search: z.string().optional(),
      featured: z.string().optional(),
      bestseller: z.string().optional(),
      inStock: z.string().optional(),
      minPrice: z.string().optional(),
      maxPrice: z.string().optional(),
      sort: z.string().optional().default('newest'),
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('20'),
    })
    .optional(),
});

export const slugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Product slug is required'),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    rating: z
      .number({ required_error: 'Rating is required' })
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    title: z.string().min(1, 'Review title is required').max(150, 'Title cannot exceed 150 characters'),
    body: z.string().min(1, 'Review body is required').max(2000, 'Body cannot exceed 2000 characters'),
    userName: z.string().optional(),
  }),
  params: z.object({
    slug: z.string().min(1, 'Product slug is required'),
  }),
});

export const adminCreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(200),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.number().min(0),
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
          sku: z.string(),
          color: z.string(),
          colorHex: z.string(),
          size: z.string(),
          price: z.number().min(0),
          stock: z.number().int().min(0),
          imageUrl: z.string().optional(),
          secondaryImageUrl: z.string().optional(),
        }),
      )
      .optional(),
  }),
});
