import mongoose, { type Document, type Model } from 'mongoose';
import type { OrderStatus } from '@vertex/types';

export interface IOrderStatusEvent extends Document {
  orderId: mongoose.Types.ObjectId;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  note?: string;
  visibility: 'customer' | 'internal';
  actor?: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderStatusEventSchema = new mongoose.Schema<IOrderStatusEvent>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    status: {
      type: String,
      enum: [
        'pending',
        'placed',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      required: true,
    },
    previousStatus: {
      type: String,
      enum: [
        'pending',
        'placed',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
    },
    note: { type: String, maxlength: 500 },
    visibility: { type: String, enum: ['customer', 'internal'], default: 'customer' },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'System' },
      role: { type: String, default: 'system' },
    },
    carrier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    estimatedDelivery: { type: Date },
    idempotencyKey: { type: String, sparse: true, index: true },
  },
  { timestamps: true },
);

orderStatusEventSchema.index({ orderId: 1, createdAt: 1 });

export const OrderStatusEvent: Model<IOrderStatusEvent> =
  mongoose.model<IOrderStatusEvent>('OrderStatusEvent', orderStatusEventSchema);
