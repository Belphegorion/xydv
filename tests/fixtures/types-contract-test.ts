import type {
  Product,
  ProductVariant,
  CartItem,
  Order,
  OrderItem,
  ShippingAddress,
  OrderStatus,
  PaymentStatus,
  RazorpayOrderPayload,
  RazorpayOrderResponse,
  RazorpayVerificationPayload,
  RazorpayVerificationResponse,
  RazorpayWebhookEvent,
  RazorpayCheckoutOptions,
} from '@vertex/types';

// Validate Product Contract
export const testVariant: ProductVariant = {
  id: 'v_1',
  sku: 'SKU-001',
  colorHex: '#0A0A0A',
  size: 'M',
  price: 148,
  stock: 20,
};

export const testProduct: Product = {
  _id: 'p_1',
  name: 'Technical Shell',
  slug: 'technical-shell',
  description: 'High performance shell',
  price: 148,
  category: 'outerwear',
  tags: ['waterproof', 'tactical'],
  variants: [testVariant],
};

// Validate Cart Item Contract
export const testCartItem: CartItem = {
  id: 'ci_1',
  productId: testProduct._id,
  name: testProduct.name,
  price: testProduct.price,
  image: '/img1.webp',
  quantity: 2,
  maxStock: 20,
};

// Validate Razorpay Contracts
export const orderPayload: RazorpayOrderPayload = {
  items: [{ productId: 'p_1', quantity: 1 }],
  shippingAddress: {
    fullName: 'Test User',
    city: 'Mumbai',
    postalCode: '400001',
    country: 'IN',
    phone: '9999999999',
  },
};

export const verifyPayload: RazorpayVerificationPayload = {
  orderId: 'ord_1',
  razorpayOrderId: 'order_123',
  razorpayPaymentId: 'pay_123',
  razorpaySignature: 'sig_123',
};

export const paymentStatus: PaymentStatus = 'captured';
export const orderStatus: OrderStatus = 'confirmed';
