import mongoose, { type Document, type Model } from 'mongoose';
import type { PaymentStatus, OrderStatus } from '@vertex/types';

export type { PaymentStatus, OrderStatus };

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrpPaise?: number;
  regularPricePaise?: number;
  effectivePricePaise?: number;
  discountId?: mongoose.Types.ObjectId;
  discountName?: string;
  discountAmountPaise?: number;
  quantity: number;
  image: string;
  discountAllocation?: number; // In paise
  taxableAmount?: number; // In paise
}

export interface IOrderCouponSnapshot {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number; // In paise
  maxDiscountCap?: number; // In paise
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId | null;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  coupon?: IOrderCouponSnapshot;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    email?: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentIntentId?: string;
  trackingNumber?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  refundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        mrpPaise: { type: Number, min: 0 },
        regularPricePaise: { type: Number, min: 0 },
        effectivePricePaise: { type: Number, min: 0 },
        discountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
        discountName: { type: String },
        discountAmountPaise: { type: Number, default: 0, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, required: false, default: '/products/image-4-1.jpg' },
        discountAllocation: { type: Number, default: 0, min: 0 },
        taxableAmount: { type: Number },
      },
    ],
    coupon: {
      code: { type: String, uppercase: true, trim: true },
      discountType: { type: String, enum: ['percentage', 'fixed'] },
      discountValue: { type: Number },
      discountAmount: { type: Number, default: 0, min: 0 },
      maxDiscountCap: { type: Number },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'captured', 'failed', 'refunded', 'refunding', 'partially_refunded'],
      default: 'pending',
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, default: '' },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'IN' },
      phone: { type: String, required: true },
      email: String,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: { type: String, select: false },
    paymentIntentId: String,
    trackingNumber: String,
    notes: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    refundId: String,
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
orderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
orderSchema.index({ paymentIntentId: 1 }, { sparse: true });

// Compound indexes for high-frequency analytics and order queries
orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
