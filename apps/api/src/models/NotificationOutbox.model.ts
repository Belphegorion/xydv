import mongoose, { type Document, type Model } from 'mongoose';

export interface INotificationOutbox extends Document {
  orderId: mongoose.Types.ObjectId;
  channel: 'email' | 'sms';
  template: string;
  recipient: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  error?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationOutboxSchema = new mongoose.Schema<INotificationOutbox>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    template: { type: String, required: true },
    recipient: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastAttemptAt: { type: Date },
    error: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const NotificationOutbox: Model<INotificationOutbox> =
  mongoose.model<INotificationOutbox>('NotificationOutbox', notificationOutboxSchema);
