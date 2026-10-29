import { EventEmitter } from 'node:events';
import mongoose from 'mongoose';
import { Order, type IOrder } from '../models/Order.model';
import { OrderStatusEvent, type IOrderStatusEvent } from '../models/OrderStatusEvent.model';
import { NotificationOutbox, type INotificationOutbox } from '../models/NotificationOutbox.model';
import type {
  OrderStatus,
  OrderTimelineResponse,
  OrderStatusEvent as OrderStatusEventType,
} from '@vertex/types';

export { type IOrderStatusEvent, type INotificationOutbox };

export const orderTrackingEmitter = new EventEmitter();

// Allow multiple concurrent SSE clients per order
orderTrackingEmitter.setMaxListeners(100);

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'], // backward compatibility alias
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'], // backward compatibility alias
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export class OrderTrackingService {
  public static isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static async updateOrderStatus(params: {
    orderId: string;
    nextStatus: OrderStatus;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date | string;
    note?: string;
    visibility?: 'customer' | 'internal';
    actor: {
      userId?: string;
      name: string;
      role: string;
    };
  }): Promise<{ order: IOrder; event: IOrderStatusEvent }> {
    const {
      orderId,
      nextStatus,
      carrier,
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
      note,
      visibility,
      actor,
    } = params;

    if (!mongoose.isValidObjectId(orderId)) {
      throw new Error('Invalid order identifier.');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const currentStatus = (order.status || 'placed') as OrderStatus;

    if (!OrderTrackingService.isValidTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed transitions: ${
          VALID_TRANSITIONS[currentStatus]?.join(', ') || 'none (terminal state)'
        }`,
      );
    }

    // Update order fields
    order.status = nextStatus;
    if (carrier !== undefined) order.carrier = carrier;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
    if (estimatedDelivery !== undefined) {
      order.estimatedDelivery =
        typeof estimatedDelivery === 'string' ? new Date(estimatedDelivery) : estimatedDelivery;
    }
    await order.save();

    // Create append-only status event
    const statusEvent = await OrderStatusEvent.create({
      orderId: order._id,
      status: nextStatus,
      previousStatus: currentStatus,
      note,
      visibility: visibility || 'customer',
      actor: {
        userId: actor.userId ? new mongoose.Types.ObjectId(actor.userId) : undefined,
        name: actor.name,
        role: actor.role,
      },
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
      etaDate: order.estimatedDelivery,
      idempotencyKey: `evt_${orderId}_${nextStatus}_${Date.now()}`,
    });

    // Enqueue transactional outbox notification
    const recipientEmail = order.shippingAddress?.email;
    const recipientPhone = order.shippingAddress?.phone;

    if (recipientEmail) {
      await NotificationOutbox.create({
        orderId: order._id,
        channel: 'email',
        template: `order_${nextStatus}`,
        recipient: recipientEmail,
        payload: {
          orderId: order._id.toString(),
          status: nextStatus,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          total: order.total,
        },
        idempotencyKey: `notif_email_${orderId}_${nextStatus}_${Date.now()}`,
      });
    }

    if (recipientPhone && ['shipped', 'out_for_delivery', 'delivered'].includes(nextStatus)) {
      await NotificationOutbox.create({
        orderId: order._id,
        channel: 'sms',
        template: `sms_order_${nextStatus}`,
        recipient: recipientPhone,
        payload: {
          orderId: order._id.toString(),
          status: nextStatus,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber,
        },
        idempotencyKey: `notif_sms_${orderId}_${nextStatus}_${Date.now()}`,
      });
    }

    // Emit real-time SSE event
    const ssePayload: OrderStatusEventType = {
      _id: statusEvent._id.toString(),
      orderId: order._id.toString(),
      status: statusEvent.status,
      previousStatus: statusEvent.previousStatus,
      note: statusEvent.note,
      visibility: statusEvent.visibility,
      carrier: statusEvent.carrier,
      trackingNumber: statusEvent.trackingNumber,
      trackingUrl: statusEvent.trackingUrl,
      estimatedDelivery: statusEvent.estimatedDelivery
        ? statusEvent.estimatedDelivery.toISOString()
        : undefined,
      etaDate: statusEvent.estimatedDelivery
        ? statusEvent.estimatedDelivery.toISOString()
        : undefined,
      createdAt: statusEvent.createdAt.toISOString(),
    };

    orderTrackingEmitter.emit(`order_update:${orderId}`, ssePayload);

    return { order, event: statusEvent };
  }

  public static async getOrderTimeline(
    orderId: string,
    includeInternal = false,
  ): Promise<OrderTimelineResponse> {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new Error('Invalid order identifier.');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const query: { orderId: mongoose.Types.ObjectId; visibility?: string } = {
      orderId: order._id as mongoose.Types.ObjectId,
    };
    if (!includeInternal) {
      query.visibility = 'customer';
    }

    const rawEvents = await OrderStatusEvent.find(query).sort({ createdAt: 1 });

    const events: OrderStatusEventType[] = rawEvents.map((e) => ({
      _id: e._id.toString(),
      orderId: e.orderId.toString(),
      status: e.status,
      previousStatus: e.previousStatus,
      note: e.note,
      visibility: e.visibility,
      carrier: e.carrier,
      trackingNumber: e.trackingNumber,
      trackingUrl: e.trackingUrl,
      estimatedDelivery: e.estimatedDelivery ? e.estimatedDelivery.toISOString() : undefined,
      etaDate: e.estimatedDelivery ? e.estimatedDelivery.toISOString() : undefined,
      createdAt: e.createdAt.toISOString(),
    }));

    // If order has no events yet (e.g. legacy order), synthesize baseline event
    if (events.length === 0) {
      events.push({
        _id: `synth_${order._id}`,
        orderId: order._id.toString(),
        status: order.status || 'placed',
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery
          ? order.estimatedDelivery.toISOString()
          : undefined,
        etaDate: order.estimatedDelivery
          ? order.estimatedDelivery.toISOString()
          : undefined,
        visibility: 'customer',
        createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    return {
      orderId: order._id.toString(),
      currentStatus: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery
        ? order.estimatedDelivery.toISOString()
        : undefined,
      shipment: {
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery
          ? order.estimatedDelivery.toISOString()
          : undefined,
      },
      events,
      timeline: events,
    };
  }
}
