import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface ICouponRedemptionDoc extends Document {
  couponId: mongoose.Types.ObjectId;
  couponCode: string;
  orderId?: mongoose.Types.ObjectId;
  razorpayOrderId?: string;
  userId?: mongoose.Types.ObjectId;
  guestEmail?: string;
  discountAmount: number; // In paise
  status: 'reserved' | 'completed' | 'released';
  createdAt: Date;
  updatedAt: Date;
}

const couponRedemptionSchema = new Schema<ICouponRedemptionDoc>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    couponCode: { type: String, required: true, uppercase: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    razorpayOrderId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestEmail: { type: String, lowercase: true, trim: true },
    discountAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['reserved', 'completed', 'released'],
      default: 'reserved',
      index: true,
    },
  },
  { timestamps: true },
);

// Compound indexes for atomic reservation and user redemption limit validation
couponRedemptionSchema.index({ couponId: 1, userId: 1, status: 1 });
couponRedemptionSchema.index({ couponId: 1, guestEmail: 1, status: 1 });

export const CouponRedemption: Model<ICouponRedemptionDoc> =
  mongoose.models.CouponRedemption ||
  mongoose.model<ICouponRedemptionDoc>('CouponRedemption', couponRedemptionSchema);
