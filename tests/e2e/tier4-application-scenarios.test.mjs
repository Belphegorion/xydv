/**
 * TIER 4: Real-World Application Scenarios Test Suite
 * Comprehensive End-to-End User Journeys:
 * 1. Complete Happy Path (Browse -> Swatch -> Add -> Free Shipping Delta ($150) -> Razorpay Modal -> Webhook -> Order Confirmation)
 * 2. Out-of-Stock Swatch Selection & In-Drawer Correction Journey
 * 3. Payment Abandonment, LocalStorage Persistence & Recovery Journey
 * 4. Client Price Tampering Neutralization Journey
 * 5. Concurrent Webhook Network Retry & Idempotency Journey
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMERCE_RULES,
  calculateCartMetrics,
  generateRazorpaySignature,
  generateWebhookSignature,
} from '../harness/contracts.mjs';
import { CATALOG_FIXTURES } from '../harness/seed-data.mjs';
import {
  LocalStorageMock,
  CartStoreSimulator,
  FocusTrapSimulator,
  RazorpayCheckoutModalSimulator,
} from '../harness/client-runtime.mjs';
import { ServerRuntimeSimulator } from '../harness/server-runtime.mjs';

describe('Tier 4: Real-World Application Scenarios (E2E User Journeys)', () => {
  // ==========================================================================
  // SCENARIO 1: Complete Happy Path E2E Journey
  // ==========================================================================
  it('T4.S1: Complete Happy Path User Journey from catalog browsing to webhook reconciliation', async () => {
    // Environment setup
    const storage = new LocalStorageMock();
    const cart = new CartStoreSimulator({ storage });
    const server = new ServerRuntimeSimulator();
    const modal = new RazorpayCheckoutModalSimulator({ keyId: server.keyId });
    await modal.loadScript();

    // 1. User browses catalog and selects Volt Performance Tee (Volt Stealth, Size M)
    const voltTee = server.catalog.find((p) => p.slug === 'volt-performance-tee');
    assert.ok(voltTee, 'Product must exist in catalog');
    const voltVariant = voltTee.variants.find((v) => v.sku === 'VPT-VLT-M');
    assert.ok(voltVariant, 'Variant must exist');
    assert.equal(voltVariant.stock, 25);

    // 2. User adds 1 Volt Tee to cart ($58.00)
    const addRes1 = cart.addItem(voltTee, voltVariant, 1);
    assert.equal(addRes1.success, true);
    assert.equal(cart.isOpen, true, 'Cart drawer must slide open');

    // 3. User inspects Free Shipping Delta Indicator
    let metrics = cart.getMetrics();
    assert.equal(metrics.subtotal, 58.0);
    assert.equal(metrics.isFreeShipping, false);
    assert.equal(metrics.shipping, 9.99);
    assert.equal(metrics.freeShippingDelta, 92.0, '$150 - $58 = $92 remaining');
    assert.equal(metrics.freeShippingProgress, 38.7);

    // 4. User browses to Stealth Tactical Tech Hoodie ($148.00) and adds 1 unit to qualify for free shipping
    const hoodie = server.catalog.find((p) => p.slug === 'stealth-tactical-tech-hoodie');
    const hoodieVariant = hoodie.variants.find((v) => v.sku === 'STH-BLK-M');
    const addRes2 = cart.addItem(hoodie, hoodieVariant, 1);
    assert.equal(addRes2.success, true);
    assert.equal(cart.items.length, 2);

    // 5. Verify Free Shipping Delta unlocks immediately ($58 + $148 = $206 >= $150)
    metrics = cart.getMetrics();
    assert.equal(metrics.subtotal, 206.0);
    assert.equal(metrics.isFreeShipping, true, 'Free shipping must unlock at $206');
    assert.equal(metrics.shipping, 0.0);
    assert.equal(metrics.freeShippingDelta, 0.0);
    assert.equal(metrics.freeShippingProgress, 100.0);
    assert.equal(metrics.tax, 16.48); // 8% of 206
    assert.equal(metrics.total, 222.48);
    assert.equal(metrics.amountPaise, 22248);

    // 6. User proceeds to Checkout -> Client calls Server Order Creation API
    const orderPayload = {
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variant.id,
        quantity: i.quantity,
      })),
      shippingAddress: {
        fullName: 'Dominic Cross',
        email: 'dominic@vertex.test',
        phone: '+1-555-0199',
        street: '742 Evergreen Terrace',
        city: 'Sector 7',
        postalCode: '90210',
        country: 'US',
      },
    };

    const serverOrderRes = server.createRazorpayOrder(orderPayload);
    assert.equal(serverOrderRes.success, true);
    assert.equal(serverOrderRes.status, 201);
    const { orderId, razorpayOrderId, amount, currency, keyId } = serverOrderRes.data;
    assert.equal(amount, 22248);
    assert.equal(currency, 'INR');

    // 7. Client launches Razorpay Modal with test options
    let clientPaymentResponse = null;
    modal.open({
      key: keyId,
      amount,
      currency,
      name: 'VERTEX TECHNICAL',
      description: 'Technical Activewear Order',
      order_id: razorpayOrderId,
      theme: { color: '#0A0A0A' },
      handler: (response) => {
        clientPaymentResponse = response;
      },
    });
    assert.equal(modal.isOpen, true);

    // 8. User simulates payment completion in Razorpay Modal
    const simulatedPaymentId = 'pay_real_sim_998877';
    const validSignature = generateRazorpaySignature(razorpayOrderId, simulatedPaymentId, server.keySecret);
    modal.simulateSuccess(simulatedPaymentId, validSignature);
    assert.equal(modal.isOpen, false);
    assert.ok(clientPaymentResponse !== null);

    // 9. Client sends payment verification to backend
    const verifyRes = server.verifyPayment({
      orderId,
      razorpayOrderId: clientPaymentResponse.razorpay_order_id,
      razorpayPaymentId: clientPaymentResponse.razorpay_payment_id,
      razorpaySignature: clientPaymentResponse.razorpay_signature,
    });
    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.data.status, 'confirmed');

    // 10. Asynchronous Razorpay Webhook fires payment.captured event
    const webhookPayload = {
      id: 'evt_hook_captured_0101',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: simulatedPaymentId,
            order_id: razorpayOrderId,
            amount,
            status: 'captured',
          },
        },
      },
    };
    const rawBody = JSON.stringify(webhookPayload);
    const webhookSig = generateWebhookSignature(rawBody, server.webhookSecret);

    const webhookRes = server.processWebhook({
      rawBody,
      signature: webhookSig,
      event: webhookPayload,
    });
    assert.equal(webhookRes.success, true);
    assert.equal(server.orders.get(razorpayOrderId).paymentStatus, 'paid');

    // 11. Cart clears on successful order completion
    cart.clearCart();
    assert.equal(cart.items.length, 0);
    assert.equal(JSON.parse(storage.getItem('vertex-cart')).state.items.length, 0);
  });

  // ==========================================================================
  // SCENARIO 2: Out-of-Stock Swatch & In-Drawer Swatch Correction
  // ==========================================================================
  it('T4.S2: Out-of-stock selection prevention and in-drawer swatch live correction journey', () => {
    const cart = new CartStoreSimulator();
    const server = new ServerRuntimeSimulator();
    const voltTee = server.catalog.find((p) => p.slug === 'volt-performance-tee');

    // Attempt to add out-of-stock XL variant (stock: 0)
    const oosVariant = voltTee.variants.find((v) => v.stock === 0);
    assert.ok(oosVariant, 'Out-of-stock variant must exist in catalog fixtures');
    const attempt1 = cart.addItem(voltTee, oosVariant, 1);
    assert.equal(attempt1.success, false);
    assert.equal(attempt1.reason, 'Out of stock');
    assert.equal(cart.items.length, 0);

    // User chooses in-stock Size M variant (stock: 25)
    const inStockVariant = voltTee.variants.find((v) => v.sku === 'VPT-VLT-M');
    const attempt2 = cart.addItem(voltTee, inStockVariant, 1);
    assert.equal(attempt2.success, true);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].variant.colorName, 'Volt Stealth');

    // Inside the cart drawer, user clicks color swatch to swap to Void Obsidian Size M (stock: 65)
    const blackVariant = voltTee.variants.find((v) => v.sku === 'VPT-BLK-M');
    const swapRes = cart.swapVariant(attempt2.itemId, blackVariant);
    assert.equal(swapRes.success, true);
    assert.equal(cart.items[0].variant.colorName, 'Void Obsidian');
    assert.equal(cart.items[0].variant.sku, 'VPT-BLK-M');

    // User increases quantity to 5
    const qtyRes = cart.updateQuantity(cart.items[0].id, 5);
    assert.equal(qtyRes.success, true);
    assert.equal(cart.items[0].quantity, 5);

    // Verify subtotal: 5 * 58 = 290 -> free shipping unlocked!
    const metrics = cart.getMetrics();
    assert.equal(metrics.subtotal, 290.0);
    assert.equal(metrics.isFreeShipping, true);
  });

  // ==========================================================================
  // SCENARIO 3: Payment Abandonment & LocalStorage Recovery Journey
  // ==========================================================================
  it('T4.S3: Payment abandonment via modal dismiss preserves cart in localStorage for later recovery', () => {
    const storage = new LocalStorageMock();
    const cart = new CartStoreSimulator({ storage });
    const modal = new RazorpayCheckoutModalSimulator();
    modal.loadScript();

    // User builds cart
    const cap = CATALOG_FIXTURES[3]; // $38
    cart.addItem(cap, cap.variants[0], 2);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].quantity, 2);

    // Launch checkout modal
    let modalDismissed = false;
    modal.open({
      key: 'rzp_test_key',
      amount: 8206,
      currency: 'INR',
      name: 'VERTEX TECHNICAL',
      order_id: 'order_abandon_123',
      modal: {
        ondismiss: () => {
          modalDismissed = true;
        },
      },
    });
    assert.equal(modal.isOpen, true);

    // User closes / dismisses the payment modal
    modal.simulateDismiss();
    assert.equal(modal.isOpen, false);
    assert.equal(modalDismissed, true);

    // Cart items are preserved
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].quantity, 2);

    // Simulate browser reload: New cart instance hydrates from localStorage
    const reloadedCart = new CartStoreSimulator({ storage });
    assert.equal(reloadedCart.items.length, 1);
    assert.equal(reloadedCart.items[0].name, cap.name);
    assert.equal(reloadedCart.items[0].quantity, 2);
    assert.equal(reloadedCart.getMetrics().subtotal, 76.0);
  });

  // ==========================================================================
  // SCENARIO 4: Client Price Tampering Neutralization Journey
  // ==========================================================================
  it('T4.S4: Tampered client price injection is neutralized by server catalog re-calculation', () => {
    const server = new ServerRuntimeSimulator();
    const stealthHoodie = server.catalog.find((p) => p.slug === 'stealth-tactical-tech-hoodie');
    assert.equal(stealthHoodie.price, 148.0);

    // An attacker tampered with client state to send price $0.01
    const tamperedPayload = {
      items: [
        {
          productId: stealthHoodie._id,
          variantId: stealthHoodie.variants[0].id,
          quantity: 1,
          price: 0.01, // MALICIOUS CLIENT PRICE
        },
      ],
      shippingAddress: {
        fullName: 'Security Auditor',
        postalCode: '10001',
      },
    };

    const serverRes = server.createRazorpayOrder(tamperedPayload);
    assert.equal(serverRes.success, true);

    // Server must enforce authentic catalogue price: $148.00 subtotal + $9.99 shipping + $11.84 tax = $169.83 total
    assert.equal(serverRes.data.breakdown.subtotal, 148.0);
    assert.equal(serverRes.data.breakdown.shipping, 9.99);
    assert.equal(serverRes.data.breakdown.tax, 11.84);
    assert.equal(serverRes.data.breakdown.total, 169.83);
    assert.equal(serverRes.data.amount, 16983); // 16983 paise, NOT 101 paise!
  });

  // ==========================================================================
  // SCENARIO 5: Concurrent Webhook Retry & Idempotency Journey
  // ==========================================================================
  it('T4.S5: Concurrent webhook delivery with identical event ID is processed idempotently', () => {
    const server = new ServerRuntimeSimulator();
    const product = server.catalog[0];

    const orderRes = server.createRazorpayOrder({
      items: [{ productId: product._id, variantId: product.variants[0].id, quantity: 1 }],
      shippingAddress: { fullName: 'Idempotency Tester', postalCode: '10001' },
    });

    const razorpayOrderId = orderRes.data.razorpayOrderId;
    const webhookPayload = {
      id: 'evt_concurrent_retry_5544',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_concurrent_5544',
            order_id: razorpayOrderId,
            amount: orderRes.data.amount,
            status: 'captured',
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = generateWebhookSignature(rawBody, server.webhookSecret);

    // First arrival
    const call1 = server.processWebhook({ rawBody, signature, event: webhookPayload });
    assert.equal(call1.success, true);
    assert.equal(call1.processed, true);
    assert.equal(server.orders.get(razorpayOrderId).paymentStatus, 'paid');

    // Duplicate arrival due to network timeout retry
    const call2 = server.processWebhook({ rawBody, signature, event: webhookPayload });
    assert.equal(call2.success, true);
    assert.equal(call2.idempotent, true, 'Duplicate webhook event must return idempotent success');
    assert.equal(server.orders.get(razorpayOrderId).paymentStatus, 'paid');
  });
});
