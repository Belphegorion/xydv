import mongoose, { type Document, type Model } from 'mongoose';

export interface IReservationItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  variantId?: string;
  quantity: number;
}

export interface IReservation extends Document {
  orderId?: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  items: IReservationItem[];
  status: 'active' | 'captured' | 'released' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reservationItemSchema = new mongoose.Schema<IReservationItem>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, default: '' },
    variantId: { type: String },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const reservationSchema = new mongoose.Schema<IReservation>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    razorpayOrderId: { type: String, required: true, index: true },
    items: [reservationItemSchema],
    status: {
      type: String,
      enum: ['active', 'captured', 'released', 'expired'],
      default: 'active',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

reservationSchema.index({ status: 1, expiresAt: 1 });

export const Reservation: Model<IReservation> =
  (mongoose.models.Reservation as Model<IReservation>) ||
  mongoose.model<IReservation>('Reservation', reservationSchema);

export default Reservation;
