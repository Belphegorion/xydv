/**
 * Razorpay Payment Gateway Types
 */

import type { PaymentStatus, ShippingAddress } from './order';

export interface RazorpayOrderPayload {
  items: Array<{
    productId: string;
    variantId?: string;
    sku?: string;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
  currency?: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string; // Internal Order _id
  razorpayOrderId: string; // Gateway order_id (e.g. order_...)
  amount: number; // in smallest currency unit (e.g. paise / cents)
  currency: string;
  keyId: string;
}

export interface RazorpayVerificationPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  message: string;
  orderId: string;
  status: PaymentStatus;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler?: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  };
}

export interface RazorpayWebhookPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
  [key: string]: unknown;
}

export interface RazorpayWebhookOrderEntity {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  [key: string]: unknown;
}

export interface RazorpayWebhookEvent {
  id?: string;
  event_id?: string;
  entity: string;
  account_id: string;
  event:
    | 'order.paid'
    | 'payment.authorized'
    | 'payment.captured'
    | 'payment.failed'
    | 'refund.processed'
    | string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayWebhookPaymentEntity;
    };
    order?: {
      entity: RazorpayWebhookOrderEntity;
    };
    [key: string]: unknown;
  };
  created_at: number;
}
