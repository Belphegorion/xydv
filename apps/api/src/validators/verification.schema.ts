import { z } from 'zod';

export const sendVerificationSchema = z.object({
  body: z.object({
    channel: z.enum(['email', 'sms'], {
      required_error: 'Channel is required (email or sms)',
    }),
    target: z.string({ required_error: 'Target (email or phone) is required' }).min(3).max(100),
    purpose: z.enum(['signup', 'change_email', 'change_phone', 'checkout', 'tracking'], {
      required_error: 'Valid verification purpose is required',
    }),
  }),
});

export const verifyChallengeSchema = z.object({
  body: z.object({
    challengeId: z.string({ required_error: 'Challenge ID is required' }).min(1),
    code: z.string().length(6).optional(),
    token: z.string().min(10).optional(),
  }),
});

export type SendVerificationInput = z.infer<typeof sendVerificationSchema>;
export type VerifyChallengeInput = z.infer<typeof verifyChallengeSchema>;
