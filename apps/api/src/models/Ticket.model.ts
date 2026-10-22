import mongoose, { type Document, type Model } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  orderId?: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new mongoose.Schema<ITicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    topic: { type: String, default: 'General Inquiry' },
    orderId: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true },
);

ticketSchema.index({ ticketId: 1 }, { unique: true });
ticketSchema.index({ email: 1 });
ticketSchema.index({ createdAt: -1 });

export const Ticket: Model<ITicket> =
  (mongoose.models.Ticket as Model<ITicket>) ||
  mongoose.model<ITicket>('Ticket', ticketSchema);
