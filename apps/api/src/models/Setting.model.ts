import mongoose, { type Document, type Model } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  shippingFee?: number;
  taxRate: number;
  lowStockThreshold: number;
  currency: string;
  currencySymbol: string;
  storeName: string;
  supportEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new mongoose.Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, default: 'global_store_settings' },
    freeShippingThreshold: { type: Number, required: true, default: 150, min: 0 },
    standardShippingFee: { type: Number, required: true, default: 15, min: 0 },
    shippingFee: { type: Number, required: false, min: 0 },
    taxRate: { type: Number, required: true, default: 0.18, min: 0, max: 1 },
    lowStockThreshold: { type: Number, required: true, default: 5, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    currencySymbol: { type: String, required: true, default: '₹' },
    storeName: { type: String, required: true, default: 'XYDV' },
    supportEmail: { type: String, required: true, default: 'support@xydv.com' },
  },
  { timestamps: true },
);

export const Setting: Model<ISetting> =
  (mongoose.models.Setting as Model<ISetting>) ||
  mongoose.model<ISetting>('Setting', settingSchema);
