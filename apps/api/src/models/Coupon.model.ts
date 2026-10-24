import mongoose, { type Document, type Model, Schema } from 'mongoose';
import type { CouponDiscountType, CouponPresetTier, CouponStatus } from '@vertex/types';

export interface ICouponDoc extends Document {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  presetTier?: CouponPresetTier;
  maxDiscountAmount?: number; // In paise
  minOrderAmount: number; // In paise
  excludeSaleItems: boolean;
  startDate: Date;
  endDate: Date;
  maxRedemptions: number;
  maxRedemptionsPerUser: number;
  redemptionCount: number;
  status: CouponStatus;
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    presetTier: { type: String, enum: ['10', '20', '50', 'custom'], default: 'custom' },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    excludeSaleItems: { type: Boolean, default: false },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    maxRedemptions: { type: Number, required: true, min: 1 },
    maxRedemptionsPerUser: { type: Number, default: 1, min: 1 },
    redemptionCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'depleted'],
      default: 'active',
      index: true,
    },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ status: 1, startDate: 1, endDate: 1 });

export const Coupon: Model<ICouponDoc> =
  mongoose.models.Coupon || mongoose.model<ICouponDoc>('Coupon', couponSchema);
