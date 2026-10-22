import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    avatar: z.string().url().optional(),
  }),
});

export const addAddressSchema = z.object({
  body: z.object({
    label: z.string().default('Home'),
    fullName: z.string().min(1, 'Full name is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('IN'),
    phone: z.string().min(1, 'Phone number is required'),
    isDefault: z.boolean().default(false),
  }),
});

export const addressIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Address ID is required'),
  }),
});
