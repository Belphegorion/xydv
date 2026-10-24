import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
      message: z
        .string()
        .min(1, 'Message is required')
        .max(500, 'Message cannot exceed 500 characters'),
      imageUrl: z.string().max(500).optional().or(z.literal('')),
      ctaText: z.string().max(40, 'CTA text cannot exceed 40 characters').optional().or(z.literal('')),
      ctaUrl: z.string().max(300).optional().or(z.literal('')),
      couponCode: z.string().max(30).optional().or(z.literal('')),
      displayFormat: z.enum(['modal', 'toast']).default('modal'),
      triggerType: z.enum(['delay', 'scroll', 'immediate']).default('delay'),
      triggerValue: z.number().min(0).max(120).default(8),
      targetPages: z.array(z.string()).default(['all']),
      targetAudience: z.enum(['all', 'guest', 'authenticated']).default('all'),
      frequencyCap: z
        .enum(['once_per_session', 'once_per_week', 'always'])
        .default('once_per_week'),
      priority: z.number().int().min(1).max(100).default(10),
      startDate: z.string().datetime().or(z.string().min(1)),
      endDate: z.string().datetime().or(z.string().min(1)),
      isActive: z.boolean().default(true),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
});

export const updateNotificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Notification ID is required'),
  }),
  body: z
    .object({
      title: z.string().min(1).max(120).optional(),
      message: z.string().min(1).max(500).optional(),
      imageUrl: z.string().max(500).optional().or(z.literal('')),
      ctaText: z.string().max(40).optional().or(z.literal('')),
      ctaUrl: z.string().max(300).optional().or(z.literal('')),
      couponCode: z.string().max(30).optional().or(z.literal('')),
      displayFormat: z.enum(['modal', 'toast']).optional(),
      triggerType: z.enum(['delay', 'scroll', 'immediate']).optional(),
      triggerValue: z.number().min(0).max(120).optional(),
      targetPages: z.array(z.string()).optional(),
      targetAudience: z.enum(['all', 'guest', 'authenticated']).optional(),
      frequencyCap: z.enum(['once_per_session', 'once_per_week', 'always']).optional(),
      priority: z.number().int().min(1).max(100).optional(),
      startDate: z.string().datetime().or(z.string().min(1)).optional(),
      endDate: z.string().datetime().or(z.string().min(1)).optional(),
      isActive: z.boolean().optional(),
    })
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

export const notificationTelemetrySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Notification ID is required'),
  }),
  body: z.object({
    event: z.enum(['impression', 'click', 'dismissal', 'dismiss'], {
      errorMap: () => ({ message: 'Event must be impression, click, or dismissal' }),
    }),
  }),
});
