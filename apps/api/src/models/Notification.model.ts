import mongoose, { type Document, type Model, Schema } from 'mongoose';
import type {
  NotificationFormat,
  NotificationTrigger,
  NotificationAudience,
  NotificationFrequency,
} from '@vertex/types';

export interface INotificationDoc extends Document {
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  couponCode?: string;
  displayFormat: NotificationFormat;
  triggerType: NotificationTrigger;
  triggerValue: number;
  targetPages: string[];
  targetAudience: NotificationAudience;
  frequencyCap: NotificationFrequency;
  priority: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  metrics: {
    impressions: number;
    clicks: number;
    dismissals: number;
  };
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true },
    ctaText: { type: String, trim: true, maxlength: 40 },
    ctaUrl: { type: String, trim: true, maxlength: 300 },
    couponCode: { type: String, trim: true, uppercase: true },
    displayFormat: { type: String, enum: ['modal', 'toast'], default: 'modal' },
    triggerType: { type: String, enum: ['delay', 'scroll', 'immediate'], default: 'delay' },
    triggerValue: { type: Number, default: 8, min: 0, max: 120 },
    targetPages: { type: [String], default: ['all'] },
    targetAudience: { type: String, enum: ['all', 'guest', 'authenticated'], default: 'all' },
    frequencyCap: {
      type: String,
      enum: ['once_per_session', 'once_per_week', 'always'],
      default: 'once_per_week',
    },
    priority: { type: Number, default: 10, min: 1, max: 100 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    metrics: {
      impressions: { type: Number, default: 0, min: 0 },
      clicks: { type: Number, default: 0, min: 0 },
      dismissals: { type: Number, default: 0, min: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// High-speed compound index for active notification fetching
notificationSchema.index({ isActive: 1, startDate: 1, endDate: 1, priority: -1 });

export const Notification: Model<INotificationDoc> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDoc>('Notification', notificationSchema);
