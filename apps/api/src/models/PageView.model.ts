import mongoose, { type Document, type Model } from 'mongoose';

export interface IPageView extends Document {
  path: string;
  date: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  createdAt: Date;
}

const pageViewSchema = new mongoose.Schema<IPageView>(
  {
    path: { type: String, required: true },
    date: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    referrer: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pageViewSchema.index({ date: 1 });
pageViewSchema.index({ path: 1 });
pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const PageView: Model<IPageView> =
  (mongoose.models.PageView as Model<IPageView>) ||
  mongoose.model<IPageView>('PageView', pageViewSchema);
