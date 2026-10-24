import mongoose, { type Document, type Model } from 'mongoose';
import type { DiscountScope, DiscountType, DiscountStatus } from '@vertex/types';

export interface IDiscount extends Document {
  name: string;
  description?: string;
  scope: DiscountScope;
  targetProductIds: mongoose.Types.ObjectId[];
  targetCategories: string[];
  type: DiscountType;
  value: number;
  priceFloorPaise: number;
  maxDiscountCapPaise?: number;
  excludedProductIds: mongoose.Types.ObjectId[];
  excludedCategories: string[];
  startDate: Date;
  endDate?: Date;
  status: DiscountStatus;
  priority: number;
  badgeLabel?: string;
  allowCouponStacking: boolean;
  maxCombinedDiscountPercent: number;
  affectedProductCount: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new mongoose.Schema<IDiscount>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    scope: {
      type: String,
      required: true,
      enum: ['product', 'category', 'catalog'],
      default: 'product',
    },
    targetProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    targetCategories: [{ type: String, trim: true, lowercase: true }],
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed_amount', 'set_price'],
      default: 'percentage',
    },
    value: { type: Number, required: true, min: 0 },
    priceFloorPaise: { type: Number, required: true, default: 29900, min: 0 }, // ₹299 minimum floor
    maxDiscountCapPaise: { type: Number, min: 0 },
    excludedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    excludedCategories: [{ type: String, trim: true, lowercase: true }],
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'scheduled', 'active', 'paused', 'ended'],
      default: 'draft',
    },
    priority: { type: Number, required: true, default: 0 },
    badgeLabel: { type: String, trim: true, maxlength: 30 },
    allowCouponStacking: { type: Boolean, default: false },
    maxCombinedDiscountPercent: { type: Number, default: 50, min: 10, max: 70 },
    affectedProductCount: { type: Number, default: 0 },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for high-frequency queries
discountSchema.index({ status: 1, startDate: 1, endDate: 1 });
discountSchema.index({ scope: 1, status: 1 });
discountSchema.index({ targetProductIds: 1 });
discountSchema.index({ targetCategories: 1 });
discountSchema.index({ createdAt: -1 });

export const Discount: Model<IDiscount> =
  (mongoose.models.Discount as Model<IDiscount>) ||
  mongoose.model<IDiscount>('Discount', discountSchema);
