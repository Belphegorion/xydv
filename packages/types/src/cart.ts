/**
 * Cart & Checkout Store Types
 */

import type { ProductVariant } from './product';

export const FREE_SHIPPING_THRESHOLD = 150;

export interface CartItem {
  id: string; // unique item id (e.g. productId + variant.sku)
  productId: string;
  slug?: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  secondaryImage?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  sku?: string;
  variant?: ProductVariant;
  quantity: number;
  maxStock: number;
}

export interface ShippingDelta {
  threshold: number; // ₹150 default
  subtotal: number;
  delta: number; // remaining to qualify for free shipping, min 0
  isFreeShipping: boolean;
  progressPercentage: number; // 0 to 100
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingDelta?: ShippingDelta;
}

export const COMMERCE_RULES = {
  freeShippingThreshold: 150.0,
  standardShippingFee: 9.99,
  taxRate: 0.08,
  currency: 'INR',
  currencyDecimals: 2,
};

export function calculateCartMetrics(items: Array<{ price: number; quantity: number }> = []) {
  const subtotal = Number(
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2),
  );
  const isFreeShipping = subtotal >= COMMERCE_RULES.freeShippingThreshold;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : COMMERCE_RULES.standardShippingFee;
  const freeShippingDelta = Math.max(0, Number((COMMERCE_RULES.freeShippingThreshold - subtotal).toFixed(2)));
  const freeShippingProgress = Math.min(
    100,
    Number(((subtotal / COMMERCE_RULES.freeShippingThreshold) * 100).toFixed(1)),
  );
  const tax = Number((subtotal * COMMERCE_RULES.taxRate).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  const amountPaise = Math.round(total * 100);

  return {
    subtotal,
    shipping,
    tax,
    total,
    amountPaise,
    isFreeShipping,
    freeShippingDelta,
    freeShippingProgress,
  };
}

