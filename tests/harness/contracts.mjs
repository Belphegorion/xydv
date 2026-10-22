/**
 * VERTEX E2E Testing Track — Master Contracts & Specifications
 * Opaque-box authoritative definitions derived directly from ORIGINAL_REQUEST.md and PROJECT.md
 */
import crypto from 'node:crypto';

export const DESIGN_TOKENS = {
  colors: {
    bg: '#0A0A0A',
    bgSurface: '#111111',
    bgElevated: '#181818',
    border: '#1F1F1F',
    borderSubtle: '#161616',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#5A5A5A',
    accent: '#E8FF00', // Volt yellow
    accentHover: '#D4EB00',
    danger: '#FF3B3B',
    success: '#22C55E',
    warning: '#F59E0B',
  },
  typography: {
    fontBody: 'SF Pro Daily Regular',
    fontHeading: 'DM Sans Display Italic',
    fontMetrics: 'technical-mono',
  },
  layout: {
    borderRadius: '0px', // Sharp brutalist
    heroMinHeight: '100dvh',
    productCardAspect: '3/4',
    bentoCellProportions: ['16:10', '3:4', '16:9', '1:1', 'full-width'],
  },
  touchTarget: {
    minWidthPx: 48,
    minHeightPx: 48,
  },
};

export const MOTION_SPECS = {
  buttonTapActiveScale: 0.97,
  maxTransitionDurationMs: 300,
  recommendedDurationMs: 240,
  easingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  allowedAnimatableProperties: ['transform', 'opacity'],
  disallowedProperties: ['width', 'height', 'margin', 'padding', 'top', 'left', 'bottom', 'right', 'all'],
  disallowedEntranceScale: 0,
  springPhysics: {
    stiffness: 350,
    damping: 35,
  },
};

export const COMMERCE_RULES = {
  freeShippingThreshold: 150.0,
  standardShippingFee: 9.99,
  taxRate: 0.08, // 8%
  currency: 'INR',
  currencyDecimals: 2,
};

export function calculateCartMetrics(items = []) {
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

export function parseHexColor(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

export function getRelativeLuminance(hex) {
  const { r, g, b } = parseHexColor(hex);
  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function getContrastRatio(foregroundHex, backgroundHex) {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function generateRazorpaySignature(orderId, paymentId, keySecret) {
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function verifyRazorpaySignature(orderId, paymentId, signature, keySecret) {
  if (typeof signature !== 'string') return false;
  const expected = generateRazorpaySignature(orderId, paymentId, keySecret);
  const bufA = Buffer.from(signature, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateWebhookSignature(rawBody, webhookSecret) {
  return crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
}

export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  if (typeof signature !== 'string') return false;
  const expected = generateWebhookSignature(rawBody, webhookSecret);
  const bufA = Buffer.from(signature, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
