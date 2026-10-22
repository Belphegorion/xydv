/**
 * Empirical Stress-Test: TypeScript Consumer Type Compatibility
 * Verifies that all types and constants exported by @vertex/types can be imported
 * and consumed without type errors under strict TypeScript compiler rules.
 */

import {
  // Constants
  FREE_SHIPPING_THRESHOLD,
  PRODUCT_CATEGORIES,
  SIZES,

  // Product Types
  type Product,
  type ProductVariant,
  type ProductSpec,
  type ProductImage,
  type InventorySpec,
  type ProductCategory,
  type Category,
  type Size,
  type ProductFilters,

  // Cart Types
  type CartItem,
  type ShippingDelta,
  type CartState,

  // Order Types
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
  type ShippingAddress,
  type Address,

  // Razorpay Types
  type RazorpayOrderPayload,
  type RazorpayOrderResponse,
  type RazorpayVerificationPayload,
  type RazorpayVerificationResponse,
  type RazorpayPaymentSuccessResponse,
  type RazorpayCheckoutOptions,
  type RazorpayWebhookPaymentEntity,
  type RazorpayWebhookOrderEntity,
  type RazorpayWebhookEvent,

  // Common Types
  type User,
  type Review,
  type ApiResponse,
  type PaginatedResponse,
} from '@vertex/types';

// 1. Verify Constants
const _thresh: number = FREE_SHIPPING_THRESHOLD;
const _cat: readonly string[] = PRODUCT_CATEGORIES;
const _sizes: readonly string[] = SIZES;

// 2. Verify Product Structures
const mockVariant: ProductVariant = {
  id: 'var_01',
  sku: 'VTX-01-M',
  colorName: 'Obsidian',
  colorHex: '#0A0A0A',
  size: 'M',
  price: 180,
  stock: 25,
  imageUrl: '/images/vtx-01.webp',
  secondaryImageUrl: '/images/vtx-01-hover.webp',
};

const mockProduct: Product = {
  _id: 'prod_01',
  name: 'Technical Shell',
  slug: 'technical-shell',
  description: 'Cordura weatherproof tactical jacket',
  price: 180,
  category: 'outerwear',
  tags: ['waterproof', 'tactical'],
  specs: [{ label: 'Fabric', value: '3L Cordura Gore-Tex' }],
  variants: [mockVariant],
  images: [{ url: '/images/vtx-01.webp', isPrimary: true, isSecondary: false }],
  inStock: true,
  featured: true,
  bestseller: false,
};

// 3. Verify CartItem Structure & Boundaries
const mockCartItem: CartItem = {
  id: 'prod_01::var_01',
  productId: 'prod_01',
  name: 'Technical Shell',
  price: 180,
  image: '/images/vtx-01.webp',
  variant: mockVariant,
  quantity: 1,
  maxStock: 25,
};

const mockShippingDelta: ShippingDelta = {
  threshold: FREE_SHIPPING_THRESHOLD,
  subtotal: 180,
  delta: 0,
  isFreeShipping: true,
  progressPercentage: 100,
};

const mockCartState: CartState = {
  items: [mockCartItem],
  isOpen: true,
  itemCount: 1,
  subtotal: 180,
  shipping: 0,
  tax: 14.4,
  total: 194.4,
  shippingDelta: mockShippingDelta,
};

// 4. Verify Razorpay Payloads & Responses
const mockOrderPayload: RazorpayOrderPayload = {
  items: [{ productId: 'prod_01', variantId: 'var_01', quantity: 1 }],
  shippingAddress: {
    fullName: 'Tactical Operative',
    city: 'Neo Tokyo',
    postalCode: '10001',
    country: 'JP',
    phone: '+819012345678',
  },
};

const mockOrderResponse: RazorpayOrderResponse = {
  success: true,
  orderId: 'ord_internal_999',
  razorpayOrderId: 'order_rzp_999',
  amount: 19440,
  currency: 'INR',
  keyId: 'rzp_test_vertex_123',
};

const mockVerificationPayload: RazorpayVerificationPayload = {
  orderId: 'ord_internal_999',
  razorpayOrderId: 'order_rzp_999',
  razorpayPaymentId: 'pay_rzp_999',
  razorpaySignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};

const mockCheckoutOptions: RazorpayCheckoutOptions = {
  key: 'rzp_test_vertex_123',
  amount: 19440,
  currency: 'INR',
  name: 'VERTEX TECHNICAL',
  order_id: 'order_rzp_999',
  theme: { color: '#0A0A0A' },
};

console.log('TypeScript strict consumer contracts verification: OK');
