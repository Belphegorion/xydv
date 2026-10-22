import mongoose, { type Document, type Model } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: Date;
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 2000 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
