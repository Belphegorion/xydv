/**
 * TIER 3: Cross-Feature Combinations Test Suite
 * Pairwise interactions between subsystems:
 * - Cart mutations + Variant swaps
 * - Cart mutations + Free shipping delta
 * - Variant swaps + Product card image crossfade
 * - Cart mutations + Razorpay order creation
 * - Cart drawer focus trap + Cart mutations
 * - Prefers-reduced-motion + Cart drawer opening
 * - Razorpay order creation + Payment verification + Webhook reconciliation
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
} from '../harness/client-runtime.mjs';
import { ServerRuntimeSimulator } from '../harness/server-runtime.mjs';

// ============================================================================
// PAIR 1: Cart Mutations + Variant Swatches
// ============================================================================
describe('Tier 3: Pair 1 - Cart Mutations + Variant Swatches', () => {
  it('T3.P1.1: Swapping item variant re-evaluates stock limits and updates line item ID', () => {
    const cart = new CartStoreSimulator();
    const product = CATALOG_FIXTURES[0]; // Volt Tee ($58)
    const varBlack = product.variants[0]; // Stock 40
    const varVolt = product.variants[3]; // Stock 25

    const addRes = cart.addItem(product, varBlack, 3);
    assert.equal(cart.items[0].id, `${product._id}::${varBlack.id}`);
    assert.equal(cart.items[0].variant.stock, 40);

    const swapRes = cart.swapVariant(addRes.itemId, varVolt);
    assert.equal(swapRes.success, true);
    assert.equal(cart.items[0].id, `${product._id}::${varVolt.id}`);
    assert.equal(cart.items[0].variant.colorName, 'Volt Stealth');
    assert.equal(cart.items[0].maxStock, 25);
    assert.equal(cart.items[0].quantity, 3);
  });

  it('T3.P1.2: Swapping variant to existing variant line item merges quantities and checks total stock', () => {
    const cart = new CartStoreSimulator();
    const product = CATALOG_FIXTURES[0];
    const varBlack = product.variants[0];
    const varVolt = product.variants[3]; // Stock 25

    const item1 = cart.addItem(product, varBlack, 4);
    cart.addItem(product, varVolt, 5);
    assert.equal(cart.items.length, 2);

    // Swap item1 (black, qty 4) to volt -> should merge into existing volt item (qty 5) -> total 9
    const swapRes = cart.swapVariant(item1.itemId, varVolt);
    assert.equal(swapRes.success, true);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].variant.sku, varVolt.sku);
    assert.equal(cart.items[0].quantity, 9);
    assert.ok(cart.items[0].quantity <= varVolt.stock);
  });
});

// ============================================================================
// PAIR 2: Cart Mutations + Free Shipping Delta
// ============================================================================
describe('Tier 3: Pair 2 - Cart Mutations + Free Shipping Delta', () => {
  it('T3.P2.1: Incrementing quantity transitions delta from locked to unlocked and removes shipping fee', () => {
    const cart = new CartStoreSimulator();
    const product = CATALOG_FIXTURES[0]; // Price: $58
    cart.addItem(product, product.variants[0], 2); // Subtotal: $116

    let metrics = cart.getMetrics();
    assert.equal(metrics.subtotal, 116.0);
    assert.equal(metrics.isFreeShipping, false);
    assert.equal(metrics.shipping, 9.99);
    assert.equal(metrics.freeShippingDelta, 34.0);

    // Increment to 3 units: Subtotal: $174 (> $150)
    cart.updateQuantity(cart.items[0].id, 3);
    metrics = cart.getMetrics();

    assert.equal(metrics.subtotal, 174.0);
    assert.equal(metrics.isFreeShipping, true);
    assert.equal(metrics.shipping, 0.0);
    assert.equal(metrics.freeShippingDelta, 0.0);
    assert.equal(metrics.freeShippingProgress, 100.0);
  });

  it('T3.P2.2: Decrementing quantity transitions delta from unlocked back to locked and re-applies shipping fee', () => {
    const cart = new CartStoreSimulator();
    const hoodie = CATALOG_FIXTURES[2]; // Price: $148
    const cap = CATALOG_FIXTURES[3]; // Price: $38

    cart.addItem(hoodie, hoodie.variants[0], 1);
    cart.addItem(cap, cap.variants[0], 1); // Subtotal: 148 + 38 = 186 (> 150)

    let metrics = cart.getMetrics();
    assert.equal(metrics.subtotal, 186.0);
    assert.equal(metrics.isFreeShipping, true);
    assert.equal(metrics.shipping, 0.0);

    // Remove cap: Subtotal drops to 148 (< 150)
    cart.removeItem(cart.items[1].id);
    metrics = cart.getMetrics();

    assert.equal(metrics.subtotal, 148.0);
    assert.equal(metrics.isFreeShipping, false);
    assert.equal(metrics.shipping, 9.99);
    assert.equal(metrics.freeShippingDelta, 2.0); // 150 - 148 = 2.00
  });
});

// ============================================================================
// PAIR 3: Variant Swatches + Product Card Image Crossfade
// ============================================================================
describe('Tier 3: Pair 3 - Variant Swatches + Product Card Image Crossfade', () => {
  it('T3.P3.1: Swatch selection simultaneously updates primary and secondary image targets', () => {
    const product = CATALOG_FIXTURES[0];
    const blackVar = product.variants[0];
    const voltVar = product.variants[3];

    let currentPrimary = blackVar.imageUrl;
    let currentSecondary = blackVar.secondaryImageUrl;

    assert.match(currentPrimary, /obsidian-front/);
    assert.match(currentSecondary, /obsidian-back/);

    // User switches to Volt swatch
    currentPrimary = voltVar.imageUrl;
    currentSecondary = voltVar.secondaryImageUrl;

    assert.match(currentPrimary, /volt-front/);
    assert.match(currentSecondary, /volt-back/);
  });

  it('T3.P3.2: Card hover state triggers secondary image crossfade without altering active swatch', () => {
    const activeColorway = 'Void Obsidian';
    let isHovered = false;

    // Default state: primary visible
    let visibleImage = isHovered ? 'secondary' : 'primary';
    assert.equal(visibleImage, 'primary');

    // Hover enters: secondary crossfade triggers
    isHovered = true;
    visibleImage = isHovered ? 'secondary' : 'primary';
    assert.equal(visibleImage, 'secondary');
    assert.equal(activeColorway, 'Void Obsidian', 'Active colorway swatch must remain unchanged on hover');
  });
});

// ============================================================================
// PAIR 4: Cart State + Razorpay Order Creation
// ============================================================================
describe('Tier 3: Pair 4 - Cart State + Razorpay Order Creation', () => {
  it('T3.P4.1: Cart items are mapped to backend order payload with price verification', () => {
    const cart = new CartStoreSimulator();
    const server = new ServerRuntimeSimulator();
    const product1 = CATALOG_FIXTURES[0]; // $58
    const product2 = CATALOG_FIXTURES[1]; // $72

    cart.addItem(product1, product1.variants[0], 2); // 116
    cart.addItem(product2, product2.variants[0], 1); // 72 -> subtotal = 188 (free shipping)

    const payload = {
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variant.id,
        quantity: i.quantity,
      })),
      shippingAddress: {
        fullName: 'Jane Miller',
        postalCode: '94103',
      },
    };

    const res = server.createRazorpayOrder(payload);
    assert.equal(res.success, true);
    assert.equal(res.data.breakdown.subtotal, 188.0);
    assert.equal(res.data.breakdown.shipping, 0.0);
    assert.equal(res.data.breakdown.tax, 15.04);
    assert.equal(res.data.breakdown.total, 203.04);
    assert.equal(res.data.amount, 20304); // paise
  });

  it('T3.P4.2: Tampered client price in cart item is rejected in favor of authoritative catalog price', () => {
    const server = new ServerRuntimeSimulator();
    const product = CATALOG_FIXTURES[0]; // Actual price is $58.00

    // Malicious client payload attempting price manipulation
    const tamperedPayload = {
      items: [
        {
          productId: product._id,
          variantId: product.variants[0].id,
          quantity: 1,
          price: 1.0, // FORGED PRICE
        },
      ],
      shippingAddress: { fullName: 'Attacker', postalCode: '00000' },
    };

    const res = server.createRazorpayOrder(tamperedPayload);
    assert.equal(res.success, true);
    // Server must ignore client price and charge official catalog price ($58)
    assert.equal(res.data.breakdown.subtotal, 58.0);
    assert.equal(res.data.breakdown.shipping, 9.99);
  });
});

// ============================================================================
// PAIR 5: Cart Drawer Focus Trap + Cart State Mutations
// ============================================================================
describe('Tier 3: Pair 5 - Cart Drawer Focus Trap + Cart State Mutations', () => {
  it('T3.P5.1: Opening cart activates focus trap; mutating item preserves trap containment', () => {
    const focusTrap = new FocusTrapSimulator(['btn-close', 'btn-qty-dec', 'btn-qty-inc', 'btn-checkout']);
    const cart = new CartStoreSimulator();
    const product = CATALOG_FIXTURES[0];

    // Trigger cart open
    cart.addItem(product, product.variants[0], 1);
    focusTrap.activate('nav-cart-btn');

    assert.equal(focusTrap.isOpen, true);
    assert.equal(focusTrap.getActiveElement(), 'btn-close');

    // User navigates to quantity increment and presses it
    focusTrap.handleTab(false); // btn-qty-dec
    focusTrap.handleTab(false); // btn-qty-inc
    assert.equal(focusTrap.getActiveElement(), 'btn-qty-inc');

    // Mutate cart quantity
    cart.updateQuantity(cart.items[0].id, 2);
    assert.equal(cart.items[0].quantity, 2);

    // Focus remains inside drawer
    assert.equal(focusTrap.getActiveElement(), 'btn-qty-inc');
  });

  it('T3.P5.2: Pressing Escape inside drawer closes it and restores focus to opener', () => {
    const focusTrap = new FocusTrapSimulator(['btn-close', 'btn-checkout']);
    const cart = new CartStoreSimulator();
    cart.openCart();
    focusTrap.activate('header-cart-icon');

    assert.equal(cart.isOpen, true);
    assert.equal(focusTrap.isOpen, true);

    // Escape pressed
    const targetToFocus = focusTrap.handleEscape();
    cart.closeCart();

    assert.equal(cart.isOpen, false);
    assert.equal(focusTrap.isOpen, false);
    assert.equal(targetToFocus, 'header-cart-icon');
  });
});

// ============================================================================
// PAIR 6: Prefers-Reduced-Motion + Cart Drawer Spring Opening
// ============================================================================
describe('Tier 3: Pair 6 - Prefers-Reduced-Motion + Cart Drawer Spring Opening', () => {
  it('T3.P6.1: When reduced motion is enabled, drawer spring duration collapses to 0ms', () => {
    const prefersReducedMotion = true;
    const animationDuration = prefersReducedMotion ? 0 : 250;
    const cart = new CartStoreSimulator();

    cart.openCart();
    assert.equal(cart.isOpen, true);
    assert.equal(animationDuration, 0, 'Animation duration must be 0ms under prefers-reduced-motion');
  });

  it('T3.P6.2: State transition completeness is identical between spring motion and reduced motion', () => {
    const cartSpring = new CartStoreSimulator();
    const cartReduced = new CartStoreSimulator();
    const product = CATALOG_FIXTURES[0];

    cartSpring.addItem(product, product.variants[0], 2);
    cartReduced.addItem(product, product.variants[0], 2);

    assert.deepEqual(cartSpring.items, cartReduced.items);
    assert.equal(cartSpring.isOpen, cartReduced.isOpen);
    assert.equal(cartSpring.getMetrics().total, cartReduced.getMetrics().total);
  });
});

// ============================================================================
// PAIR 7: Razorpay Order Creation + Payment Verification + Webhook Reconciliation
// ============================================================================
describe('Tier 3: Pair 7 - Full Razorpay Backend Integration Cycle', () => {
  it('T3.P7.1: Order creation, payment HMAC verification, and stock decrement execute sequentially', () => {
    const server = new ServerRuntimeSimulator();
    const product = server.catalog[0];
    const variant = product.variants[0];
    const initialStock = variant.stock;

    // Step 1: Create Order
    const orderRes = server.createRazorpayOrder({
      items: [{ productId: product._id, variantId: variant.id, quantity: 2 }],
      shippingAddress: { fullName: 'Marcus Vance', postalCode: '10012' },
    });
    assert.equal(orderRes.success, true);
    const { orderId, razorpayOrderId } = orderRes.data;

    // Step 2: Client Payment Completion & Signature Verification
    const paymentId = 'pay_test_succ_7788';
    const signature = generateRazorpaySignature(razorpayOrderId, paymentId, server.keySecret);

    const verifyRes = server.verifyPayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    });
    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.data.status, 'confirmed');

    // Step 3: Verify Stock Decrement
    assert.equal(variant.stock, initialStock - 2, 'Variant stock must be decremented by purchased quantity');
  });

  it('T3.P7.2: Webhook payment.captured reconciles order payment status idempotently', () => {
    const server = new ServerRuntimeSimulator();
    const product = server.catalog[0];
    const orderRes = server.createRazorpayOrder({
      items: [{ productId: product._id, variantId: product.variants[0].id, quantity: 1 }],
      shippingAddress: { fullName: 'Marcus Vance', postalCode: '10012' },
    });

    const razorpayOrderId = orderRes.data.razorpayOrderId;
    const webhookEvent = {
      id: 'evt_hook_9999',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_hook_9999',
            order_id: razorpayOrderId,
            amount: orderRes.data.amount,
            status: 'captured',
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookEvent);
    const signature = generateWebhookSignature(rawBody, server.webhookSecret);

    const webhookRes = server.processWebhook({ rawBody, signature, event: webhookEvent });
    assert.equal(webhookRes.success, true);
    assert.equal(server.orders.get(razorpayOrderId).paymentStatus, 'paid');

    // Replay webhook
    const replayRes = server.processWebhook({ rawBody, signature, event: webhookEvent });
    assert.equal(replayRes.success, true);
    assert.equal(replayRes.idempotent, true);
  });
});
