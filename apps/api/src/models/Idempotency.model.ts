import mongoose, { type Document, type Model } from 'mongoose';

export interface IProcessedWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  status: string;
  createdAt: Date;
}

const idempotencySchema = new mongoose.Schema<IProcessedWebhookEvent>(
  {
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    status: { type: String, default: 'processed' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

idempotencySchema.index({ eventId: 1 }, { unique: true });
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

export const ProcessedWebhookEvent: Model<IProcessedWebhookEvent> =
  (mongoose.models.ProcessedWebhookEvent as Model<IProcessedWebhookEvent>) ||
  mongoose.model<IProcessedWebhookEvent>('ProcessedWebhookEvent', idempotencySchema);

export const Idempotency = ProcessedWebhookEvent;
export default ProcessedWebhookEvent;
