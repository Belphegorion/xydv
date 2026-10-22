import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { ProcessedWebhookEvent, Idempotency } from '../models/Idempotency.model';

export { ProcessedWebhookEvent, Idempotency };

export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  const existing = await ProcessedWebhookEvent.findOne({ eventId });
  return Boolean(existing);
}

export async function recordWebhookEventProcessed(
  eventId: string,
  eventType: string,
): Promise<void> {
  await ProcessedWebhookEvent.create({ eventId, eventType });
}

const router = Router();

// POST /api/webhooks/razorpay — raw body Buffer preserved in server.ts
router.post('/razorpay', webhookController.handleRazorpayWebhook.bind(webhookController));

export default router;
