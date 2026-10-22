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

export interface CommerceRules {
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxRate: number;
  currency: string;
  currencyDecimals: number;
}

export const COMMERCE_RULES: CommerceRules = {
  freeShippingThreshold: 150.0,
  standardShippingFee: 15.0,
  taxRate: 0.18,
  currency: 'INR',
  currencyDecimals: 2,
};

export function calculateCartMetrics(
  items: Array<{ price: number; quantity: number }> = [],
  customRules?: Partial<CommerceRules>,
) {
  const rules = customRules ? { ...COMMERCE_RULES, ...customRules } : COMMERCE_RULES;
  const subtotal = Number(
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2),
  );
  const isFreeShipping = subtotal >= rules.freeShippingThreshold;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : rules.standardShippingFee;
  const freeShippingDelta = Math.max(
    0,
    Number((rules.freeShippingThreshold - subtotal).toFixed(2)),
  );
  const freeShippingProgress = Math.min(
    100,
    Number(((subtotal / rules.freeShippingThreshold) * 100).toFixed(1)),
  );
  const tax = Number((subtotal * rules.taxRate).toFixed(2));
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
