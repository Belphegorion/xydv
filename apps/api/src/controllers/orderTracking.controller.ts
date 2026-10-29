import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { OrderStatusEvent } from '../models/OrderStatusEvent.model';
import { OrderTrackingService, orderTrackingEmitter } from '../services/orderTracking.service';
import type { OrderStatusEvent as OrderStatusEventType } from '@vertex/types';

export class OrderTrackingController {
  public static async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const orderId = (req.params.orderId || req.params.id) as string;
      const user = req.user;

      if (!orderId || !mongoose.isValidObjectId(orderId)) {
        res.status(400).json({ success: false, message: 'Invalid order identifier.' });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      // Authorization: Must be order owner, matching guest email, or admin
      const orderUserId =
        order.userId && typeof order.userId === 'object' && '_id' in order.userId
          ? String((order.userId as { _id?: unknown })._id)
          : order.userId
          ? String(order.userId)
          : undefined;
      const isOwner = Boolean(user?._id && orderUserId && orderUserId === user._id);
      const isAdmin = user?.role === 'admin';
      const guestEmail =
        typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : undefined;
      const isMatchingGuest = Boolean(
        guestEmail &&
          order.shippingAddress?.email &&
          order.shippingAddress.email.toLowerCase() === guestEmail,
      );

      if (!isOwner && !isAdmin && !isMatchingGuest) {
        res.status(403).json({ success: false, message: 'Access denied to this order timeline.' });
        return;
      }

      const timeline = await OrderTrackingService.getOrderTimeline(orderId, isAdmin);
      res.status(200).json({
        success: true,
        data: timeline,
        timeline: timeline.timeline,
        currentStatus: timeline.currentStatus,
        shipment: timeline.shipment,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch order timeline.';
      res.status(500).json({ success: false, message, error: message });
    }
  }

  public static async streamOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = (req.params.orderId || req.params.id) as string;
      const user = req.user;

      if (!orderId || !mongoose.isValidObjectId(orderId)) {
        res.status(400).json({ success: false, message: 'Invalid order identifier.' });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      const orderUserId =
        order.userId && typeof order.userId === 'object' && '_id' in order.userId
          ? String((order.userId as { _id?: unknown })._id)
          : order.userId
          ? String(order.userId)
          : undefined;
      const isOwner = Boolean(user?._id && orderUserId && orderUserId === user._id);
      const isAdmin = user?.role === 'admin';
      const guestEmail =
        typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : undefined;
      const isMatchingGuest = Boolean(
        guestEmail &&
          order.shippingAddress?.email &&
          order.shippingAddress.email.toLowerCase() === guestEmail,
      );

      if (!isOwner && !isAdmin && !isMatchingGuest) {
        res.status(403).json({ success: false, message: 'Access denied to this live order stream.' });
        return;
      }

      // Configure Server-Sent Events headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Send initial snapshot
      const timeline = await OrderTrackingService.getOrderTimeline(orderId, isAdmin);
      res.write(`event: initial_state\ndata: ${JSON.stringify(timeline)}\n\n`);

      // Support Last-Event-ID resume: replay events if requested
      const lastEventId = (req.headers['last-event-id'] || req.query.lastEventId) as
        | string
        | undefined;
      if (lastEventId && mongoose.isValidObjectId(lastEventId)) {
        const missedEvents = await OrderStatusEvent.find({
          orderId: order._id,
          _id: { $gt: new mongoose.Types.ObjectId(lastEventId) },
          ...(isAdmin ? {} : { visibility: 'customer' }),
        }).sort({ createdAt: 1 });

        for (const evt of missedEvents) {
          const replayPayload: OrderStatusEventType = {
            _id: evt._id.toString(),
            orderId: evt.orderId.toString(),
            status: evt.status,
            previousStatus: evt.previousStatus,
            note: evt.note,
            visibility: evt.visibility,
            carrier: evt.carrier,
            trackingNumber: evt.trackingNumber,
            trackingUrl: evt.trackingUrl,
            estimatedDelivery: evt.estimatedDelivery ? evt.estimatedDelivery.toISOString() : undefined,
            etaDate: evt.estimatedDelivery ? evt.estimatedDelivery.toISOString() : undefined,
            createdAt: evt.createdAt.toISOString(),
          };
          res.write(
            `event: order_update\nid: ${replayPayload._id}\ndata: ${JSON.stringify(replayPayload)}\n\n`,
          );
        }
      }

      // 15-second heartbeat to keep connection alive through Nginx & AWS ALB
      const heartbeatInterval = setInterval(() => {
        if (!res.writableEnded) {
          res.write(': ping\n\n');
        }
      }, 15000);
      heartbeatInterval.unref();

      // Event listener for order updates
      const eventChannel = `order_update:${orderId}`;
      const onOrderUpdate = (event: OrderStatusEventType) => {
        if (!res.writableEnded) {
          res.write(`event: order_update\nid: ${event._id}\ndata: ${JSON.stringify(event)}\n\n`);
        }
      };

      orderTrackingEmitter.on(eventChannel, onOrderUpdate);

      // Clean up on disconnect
      req.on('close', () => {
        clearInterval(heartbeatInterval);
        orderTrackingEmitter.removeListener(eventChannel, onOrderUpdate);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stream connection error.';
      if (!res.headersSent) {
        res.status(500).json({ success: false, message, error: message });
      }
    }
  }

  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = (req.params.orderId || req.params.id) as string;
      const { status, carrier, trackingNumber, trackingUrl, estimatedDelivery, note, visibility } =
        req.body;
      const actor = {
        userId: req.user?._id,
        name: req.user?.email || 'Admin',
        role: 'admin',
      };

      const result = await OrderTrackingService.updateOrderStatus({
        orderId,
        nextStatus: status,
        carrier,
        trackingNumber,
        trackingUrl,
        estimatedDelivery,
        note,
        visibility,
        actor,
      });

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}.`,
        data: {
          order: result.order,
          event: result.event,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status.';
      res.status(400).json({
        success: false,
        message,
        error: message,
      });
    }
  }
}
