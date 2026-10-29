/**
 * Order & Fulfillment Domain Types
 */

export type OrderStatus =
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending' | 'captured' | 'failed' | 'refunded' | 'refunding' | 'partially_refunded';

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  discountAllocation?: number;
  taxableAmount?: number;
}

export interface OrderCouponSnapshot {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  maxDiscountCap?: number;
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

export interface OrderUserRef {
  _id: string;
  name?: string;
  email?: string;
}

export interface OrderStatusEvent {
  _id?: string;
  id?: string;
  orderId: string;
  status: OrderStatus;
  previousStatus?: string;
  note?: string;
  visibility: 'customer' | 'internal';
  actor?: {
    userId?: string;
    name: string;
    role: string;
  };
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  etaDate?: string | Date;
  estimatedDelivery?: string;
  idempotencyKey?: string;
  createdAt: string | Date;
}

export interface ShipmentDetails {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string | Date;
}

export interface OrderTimelineResponse {
  orderId: string;
  currentStatus: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string | Date;
  shipment?: ShipmentDetails;
  events?: OrderStatusEvent[];
  timeline: OrderStatusEvent[];
}

export interface Order {
  _id: string;
  userId?: string | OrderUserRef | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  coupon?: OrderCouponSnapshot;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentIntentId?: string; // backward-compat optional
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundId?: string;
  createdAt: string;
  updatedAt: string;
}
