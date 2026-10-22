/**
 * Server Runtime Simulation for VERTEX E2E Testing Track
 * Handles Razorpay order creation with server-side price validation,
 * cryptographic payment verification, inventory stock mutations,
 * and webhook reconciliation with idempotency protection.
 */
import crypto from 'node:crypto';
import { CATALOG_FIXTURES } from './seed-data.mjs';
import {
  COMMERCE_RULES,
  calculateCartMetrics,
  generateRazorpaySignature,
  verifyRazorpaySignature,
  generateWebhookSignature,
  verifyWebhookSignature,
} from './contracts.mjs';

export class ServerRuntimeSimulator {
  constructor({
    catalog = JSON.parse(JSON.stringify(CATALOG_FIXTURES)),
    keyId = 'rzp_test_vertex_1234567890',
    keySecret = 'mock_secret_vertex_abcdef123456',
    webhookSecret = 'whsec_vertex_secret_7890xyz',
  } = {}) {
    this.catalog = catalog;
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.orders = new Map();
    this.processedWebhookEventIds = new Set();
    this.orderCounter = 1000;
  }

  findProductAndVariant(productId, variantIdOrSku) {
    const product = this.catalog.find((p) => p._id === productId);
    if (!product) return { product: null, variant: null };
    const variant = product.variants.find(
      (v) => v.id === variantIdOrSku || v.sku === variantIdOrSku,
    );
    return { product, variant };
  }

  createRazorpayOrder({ items, shippingAddress }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, status: 400, error: 'Cart must contain at least one item' };
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.postalCode) {
      return { success: false, status: 400, error: 'Valid shipping address required' };
    }

    const verifiedLineItems = [];

    // Authoritative Server-side catalog lookup and inventory check
    for (const item of items) {
      const { product, variant } = this.findProductAndVariant(item.productId, item.variantId);
      if (!product) {
        return { success: false, status: 404, error: `Product not found: ${item.productId}` };
      }
      if (!variant) {
        return { success: false, status: 404, error: `Variant not found: ${item.variantId}` };
      }

      if (
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return { success: false, status: 400, error: `Invalid quantity for variant ${variant.sku}` };
      }

      const requestedQty = item.quantity;

      if (variant.stock < requestedQty) {
        return {
          success: false,
          status: 400,
          error: `Insufficient stock for ${product.name} (${variant.sku}). Available: ${variant.stock}, requested: ${requestedQty}`,
        };
      }

      verifiedLineItems.push({
        productId: product._id,
        variantId: variant.id,
        sku: variant.sku,
        name: product.name,
        price: product.price, // STRICT AUTHORITATIVE CATALOG PRICE
        quantity: requestedQty,
      });
    }

    const metrics = calculateCartMetrics(verifiedLineItems);
    this.orderCounter += 1;
    const internalOrderId = `ord_vtx_${this.orderCounter}`;
    const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    const orderRecord = {
      orderId: internalOrderId,
      razorpayOrderId,
      items: verifiedLineItems,
      shippingAddress,
      subtotal: metrics.subtotal,
      shipping: metrics.shipping,
      tax: metrics.tax,
      total: metrics.total,
      amountPaise: metrics.amountPaise,
      currency: COMMERCE_RULES.currency,
      paymentStatus: 'created',
      razorpayPaymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(razorpayOrderId, orderRecord);

    return {
      success: true,
      status: 201,
      data: {
        orderId: internalOrderId,
        razorpayOrderId,
        amount: metrics.amountPaise,
        currency: COMMERCE_RULES.currency,
        keyId: this.keyId,
        breakdown: {
          subtotal: metrics.subtotal,
          shipping: metrics.shipping,
          tax: metrics.tax,
          total: metrics.total,
        },
      },
    };
  }

  verifyPayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { success: false, status: 400, error: 'Missing required payment verification fields' };
    }

    const order = this.orders.get(razorpayOrderId);
    if (!order) {
      return { success: false, status: 404, error: 'Order not found' };
    }

    // Cryptographic signature check
    let isValidSignature = false;
    try {
      isValidSignature = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        this.keySecret,
      );
    } catch {
      isValidSignature = false;
    }

    if (!isValidSignature) {
      order.paymentStatus = 'failed';
      order.updatedAt = new Date().toISOString();
      return { success: false, status: 400, error: 'Invalid HMAC payment signature' };
    }

    // If order was already paid, maintain idempotency
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'confirmed') {
      return {
        success: true,
        status: 200,
        message: 'Payment already verified',
        orderId: order.orderId,
      };
    }

    // Success path: update order and mutate stock
    order.paymentStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.updatedAt = new Date().toISOString();

    for (const item of order.items) {
      const { variant } = this.findProductAndVariant(item.productId, item.variantId);
      if (variant) {
        variant.stock = Math.max(0, variant.stock - item.quantity);
      }
    }

    return {
      success: true,
      status: 200,
      data: {
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        status: order.paymentStatus,
      },
    };
  }

  processWebhook({ rawBody, signature, event }) {
    if (!rawBody || !signature) {
      return { success: false, status: 400, error: 'Missing webhook payload or signature' };
    }

    let isValid = false;
    try {
      isValid = verifyWebhookSignature(rawBody, signature, this.webhookSecret);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return { success: false, status: 401, error: 'Invalid webhook signature' };
    }

    const payload = typeof event === 'object' ? event : JSON.parse(rawBody);
    const eventId = payload.id || payload.event_id;

    // Idempotency check: don't process duplicate events
    if (eventId && this.processedWebhookEventIds.has(eventId)) {
      return {
        success: true,
        status: 200,
        idempotent: true,
        message: `Event ${eventId} already processed`,
      };
    }

    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;

      if (razorpayOrderId && this.orders.has(razorpayOrderId)) {
        const order = this.orders.get(razorpayOrderId);
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = paymentEntity.id;
        order.updatedAt = new Date().toISOString();
      }
    }

    if (eventId) {
      this.processedWebhookEventIds.add(eventId);
    }

    return {
      success: true,
      status: 200,
      processed: true,
      event: payload.event,
    };
  }
}
