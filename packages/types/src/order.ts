/**
 * Order & Fulfillment Domain Types
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'refunding' | 'partially_refunded';

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  line1?: string;
  street?: string; // alias for line1
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  email?: string;
}

export type Address = ShippingAddress;

export interface Order {
  _id: string;
  userId?: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentIntentId?: string; // backward-compat optional
  trackingNumber?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundId?: string;
  createdAt: string;
  updatedAt: string;
}

