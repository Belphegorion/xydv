import type { Request, Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order.model';
import { ProcessedWebhookEvent } from '../models/Idempotency.model';
import { RAZORPAY_WEBHOOK_SECRET } from '../config/razorpay';
import { inventoryService } from '../services/inventory.service';
import { couponService } from '../services/coupon.service';
import { logger } from '../config/logger';
import type { RazorpayWebhookEvent } from '@vertex/types';

// In-memory idempotency cache for fast recent deduplication
const processedWebhookEventIds = new Set<string>();
const MAX_PROCESSED_EVENTS = 10000;

function recordProcessedEvent(eventId: string): void {
  if (processedWebhookEventIds.size >= MAX_PROCESSED_EVENTS) {
    const oldestKey = processedWebhookEventIds.values().next().value;
    if (oldestKey) processedWebhookEventIds.delete(oldestKey);
  }
  processedWebhookEventIds.add(eventId);
}

export class WebhookController {
  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    const signatureHeader = req.headers['x-razorpay-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET;

    if (!signature || typeof signature !== 'string' || !webhookSecret) {
      res.status(400).json({ error: 'Missing x-razorpay-signature header or webhook secret' });
      return;
    }

    // 1. Safeguard against missing, empty, or non-buffer raw bodies
    if (!req.body) {
      res.status(400).json({ error: 'Empty or missing webhook body' });
      return;
    }

    let rawBody: Buffer;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      rawBody = Buffer.from(req.body, 'utf-8');
    } else {
      res.status(400).json({ error: 'Malformed webhook payload. Expected raw buffer or string.' });
      return;
    }

    if (rawBody.length === 0) {
      res.status(400).json({ error: 'Empty webhook body' });
      return;
    }

    // 2. Timing-safe HMAC verification with buffer length check
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    const isSignatureValid =
      expectedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(expectedBuf, signatureBuf);

    if (!isSignatureValid) {
      logger.error('Razorpay webhook HMAC signature verification failed');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // 3. Safe JSON parsing of raw body
    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody.toString('utf-8')) as RazorpayWebhookEvent;
    } catch (err) {
      logger.error('Failed to parse Razorpay webhook payload:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    if (!event || typeof event !== 'object' || !event.event) {
      res.status(400).json({ error: 'Invalid event structure' });
      return;
    }

    const eventId = event.id || event.event_id;

    // 4. Webhook Idempotency Check: reject duplicate event IDs cleanly with 200
    if (eventId) {
      if (processedWebhookEventIds.has(eventId)) {
        res.json({
          status: 'ok',
          received: true,
          idempotent: true,
          message: `Event ${eventId} already processed`,
        });
        return;
      }

      try {
        const existingEvent = await ProcessedWebhookEvent.findOne({ eventId });
        if (existingEvent) {
          recordProcessedEvent(eventId);
          res.json({
            status: 'ok',
            received: true,
            idempotent: true,
            message: `Event ${eventId} already processed`,
          });
          return;
        }

        await ProcessedWebhookEvent.create({ eventId, eventType: event.event });
        recordProcessedEvent(eventId);
      } catch (dbErr) {
        if (
          typeof dbErr === 'object' &&
          dbErr !== null &&
          'code' in dbErr &&
          dbErr.code === 11000
        ) {
          recordProcessedEvent(eventId);
          res.json({
            status: 'ok',
            received: true,
            idempotent: true,
            message: `Event ${eventId} already processed`,
          });
          return;
        }
      }
    }

    try {
      switch (event.event) {
        case 'payment.captured': {
          const payment = event.payload.payment?.entity;
          if (payment?.order_id) {
            const existingOrder = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (!existingOrder) {
              logger.warn(`Order not found for captured payment: ${payment.order_id}`);
              break;
            }

            // C-2: Assert payment.amount matches order total in paise
            const expectedPaise = Math.round(existingOrder.total * 100);
            if (payment.amount !== undefined && payment.amount !== expectedPaise) {
              logger.error(
                `Payment amount mismatch for order ${payment.order_id}: expected ${expectedPaise} paise, received ${payment.amount} paise`,
              );
              await Order.updateOne(
                { _id: existingOrder._id },
                { $set: { paymentStatus: 'failed', status: 'cancelled' } },
              );
              break;
            }

            const updatedOrder = await Order.findOneAndUpdate(
              { razorpayOrderId: payment.order_id, paymentStatus: { $ne: 'captured' } },
              {
                $set: {
                  razorpayPaymentId: payment.id,
                  paymentStatus: 'captured',
                  status: 'confirmed',
                },
              },
              { new: true },
            );

            if (!updatedOrder) {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${payment.order_id} already captured`,
              });
              return;
            }

            // Clear reservation (decrements reservedStock)
            await inventoryService.captureReservation(payment.order_id);

            // H-4: Commit coupon redemption
            await couponService.commitRedemption(payment.order_id).catch((err) => {
              logger.warn('Failed to commit coupon redemption in payment.captured webhook:', {
                error: err,
              });
            });
          }
          break;
        }

        case 'order.paid': {
          const orderEntity = event.payload.order?.entity;
          if (orderEntity?.id) {
            const existingOrder = await Order.findOne({ razorpayOrderId: orderEntity.id });
            if (!existingOrder) {
              logger.warn(`Order not found for paid order: ${orderEntity.id}`);
              break;
            }

            // A-2: Assert orderEntity.amount_paid matches order total in paise
            const expectedPaise = Math.round(existingOrder.total * 100);
            if (typeof orderEntity.amount_paid !== 'number' || orderEntity.amount_paid !== expectedPaise) {
              logger.error(
                `Payment amount mismatch for order ${orderEntity.id}: expected ${expectedPaise} paise, received ${orderEntity.amount_paid} paise`,
              );
              await Order.updateOne(
                { _id: existingOrder._id },
                { $set: { paymentStatus: 'failed', status: 'cancelled' } },
              );
              break;
            }

            // C-3: Extract razorpayPaymentId if available from payment entity or payload
            const paymentEntity = event.payload.payment?.entity;
            const paymentId =
              paymentEntity?.id ||
              (typeof orderEntity['payment_id'] === 'string' ? orderEntity['payment_id'] : undefined);

            const updateFields: Record<string, unknown> = {
              paymentStatus: 'captured',
              status: 'confirmed',
            };
            if (paymentId) {
              updateFields.razorpayPaymentId = paymentId;
            }

            const updatedOrder = await Order.findOneAndUpdate(
              { razorpayOrderId: orderEntity.id, paymentStatus: { $ne: 'captured' } },
              { $set: updateFields },
              { new: true },
            );

            if (!updatedOrder) {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${orderEntity.id} already captured`,
              });
              return;
            }

            await inventoryService.captureReservation(orderEntity.id);

            // H-4: Commit coupon redemption
            await couponService.commitRedemption(orderEntity.id).catch((err) => {
              logger.warn('Failed to commit coupon redemption in order.paid webhook:', {
                error: err,
              });
            });
          }
          break;
        }

        case 'payment.failed': {
          const payment = event.payload.payment?.entity;
          if (payment?.order_id) {
            const existingOrder = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (existingOrder) {
              // Guard: Do not overwrite an already captured order with an out-of-order failure
              if (existingOrder.paymentStatus === 'captured') {
                if (eventId) recordProcessedEvent(eventId);
                res.json({
                  status: 'ok',
                  received: true,
                  idempotent: true,
                  message: `Order ${payment.order_id} already captured; ignoring out-of-order payment.failed`,
                });
                return;
              }

              if (existingOrder.paymentStatus === 'failed') {
                if (eventId) recordProcessedEvent(eventId);
                res.json({
                  status: 'ok',
                  received: true,
                  idempotent: true,
                  message: `Order ${payment.order_id} already marked failed`,
                });
                return;
              }

              existingOrder.razorpayPaymentId = payment.id;
              existingOrder.paymentStatus = 'failed';
              existingOrder.status = 'cancelled';
              await existingOrder.save();

              // Release reservation back to stock and release reserved coupon
              await inventoryService.releaseReservation(payment.order_id);
              await couponService.releaseRedemption(payment.order_id).catch(() => {});
            }
          }
          break;
        }

        default:
          logger.info(`Unhandled Razorpay event: ${event.event}`, { event: event.event });
      }

      if (eventId) {
        recordProcessedEvent(eventId);
      }

      res.json({ status: 'ok', received: true, processed: true });
    } catch (err) {
      logger.error('Error processing Razorpay webhook event:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal server error processing webhook' });
    }
  }
}

export const webhookController = new WebhookController();
export default webhookController;
