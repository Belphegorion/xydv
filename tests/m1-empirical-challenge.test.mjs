/**
 * M1 Empirical Challenge & Adversarial Verification Suite
 * Authored by m1_challenger_1 (empirical_challenger)
 * 
 * Verifies:
 * 1. HMAC-SHA256 signature generation and tamper testing (bit flips, truncation, wrong secret, payload tampering)
 * 2. Razorpay order creation validation (empty items, negative quantities, client price tampering, stock bounds)
 * 3. @vertex/types compilation, export resolution, and type safety
 * 4. Production API implementation vulnerability audit
 */
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ServerRuntimeSimulator } from './harness/server-runtime.mjs';
import { CATALOG_FIXTURES } from './harness/seed-data.mjs';
import {
  COMMERCE_RULES,
  calculateCartMetrics,
  generateRazorpaySignature,
  verifyRazorpaySignature,
  generateWebhookSignature,
  verifyWebhookSignature,
} from './harness/contracts.mjs';

// ============================================================================
// SUITE 1: HMAC-SHA256 Signature Generation & Adversarial Tamper Testing
// ============================================================================
describe('M1 Empirical Challenge: HMAC-SHA256 Cryptographic Tamper Testing', () => {
  const orderId = 'order_DA294FA1BC2049';
  const paymentId = 'pay_992014ABCDF012';
  const keySecret = 'vertex_secret_key_prod_test_012345';
  const webhookSecret = 'whsec_vertex_secret_test_abcdef';

  it('1.1: Valid Razorpay payment signature generates and verifies cleanly', () => {
    const signature = generateRazorpaySignature(orderId, paymentId, keySecret);
    assert.equal(typeof signature, 'string');
    assert.equal(signature.length, 64, 'HMAC-SHA256 hex digest must be exactly 64 characters');

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature, keySecret);
    assert.equal(isValid, true, 'Valid signature must verify as true');
  });

  it('1.2: Tampered signature (single hex character bit-flip) is strictly rejected', () => {
    const signature = generateRazorpaySignature(orderId, paymentId, keySecret);
    
    // Flip first character
    const flippedFirst = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
    assert.equal(verifyRazorpaySignature(orderId, paymentId, flippedFirst, keySecret), false);

    // Flip middle character
    const midIdx = 32;
    const flippedMid = signature.slice(0, midIdx) + (signature[midIdx] === '0' ? '1' : '0') + signature.slice(midIdx + 1);
    assert.equal(verifyRazorpaySignature(orderId, paymentId, flippedMid, keySecret), false);

    // Flip last character
    const lastIdx = 63;
    const flippedLast = signature.slice(0, lastIdx) + (signature[lastIdx] === 'f' ? 'e' : 'f');
    assert.equal(verifyRazorpaySignature(orderId, paymentId, flippedLast, keySecret), false);
  });

  it('1.3: Tampered order ID or payment ID with valid signature is rejected', () => {
    const signature = generateRazorpaySignature(orderId, paymentId, keySecret);

    // Tamper orderId
    const tamperedOrderId = 'order_DA294FA1BC2040'; // altered last digit
    assert.equal(verifyRazorpaySignature(tamperedOrderId, paymentId, signature, keySecret), false);

    // Tamper paymentId
    const tamperedPaymentId = 'pay_992014ABCDF013'; // altered last digit
    assert.equal(verifyRazorpaySignature(orderId, tamperedPaymentId, signature, keySecret), false);
  });

  it('1.4: Signature generated with wrong secret key is rejected', () => {
    const attackerSecret = 'attacker_forged_secret_key_999999';
    const forgedSignature = generateRazorpaySignature(orderId, paymentId, attackerSecret);

    const isValid = verifyRazorpaySignature(orderId, paymentId, forgedSignature, keySecret);
    assert.equal(isValid, false, 'Forged signature with different secret must be rejected');
  });

  it('1.5: Truncated or malformed length signatures do not throw uncaught exceptions in ServerRuntime', () => {
    const server = new ServerRuntimeSimulator({ keySecret });

    const orderRes = server.createRazorpayOrder({
      items: [{ productId: CATALOG_FIXTURES[0]._id, variantId: CATALOG_FIXTURES[0].variants[0].id, quantity: 1 }],
      shippingAddress: { fullName: 'Test User', postalCode: '10001' },
    });
    assert.equal(orderRes.success, true);

    const testCases = [
      '',                     // empty string
      'a',                    // 1 char
      'abc123',               // 6 chars
      '0'.repeat(32),         // 32 chars (MD5 length)
      '0'.repeat(63),         // 63 chars (off by one short)
      '0'.repeat(65),         // 65 chars (off by one long)
      '0'.repeat(128),        // 128 chars (SHA512 length)
      'xyz!@#$%^&*()_+',      // special characters
    ];

    for (const badSig of testCases) {
      const verifyRes = server.verifyPayment({
        orderId: orderRes.data.orderId,
        razorpayOrderId: orderRes.data.razorpayOrderId,
        razorpayPaymentId: 'pay_test_001',
        razorpaySignature: badSig,
      });

      assert.equal(verifyRes.success, false, `Signature '${badSig}' must fail verification`);
      assert.equal(verifyRes.status, 400);
      assert.match(verifyRes.error, /Invalid HMAC payment signature|Missing/);
    }
  });

  it('1.6: Webhook raw body HMAC signature verifies and rejects byte-level payload tampering', () => {
    const webhookPayload = JSON.stringify({
      entity: 'event',
      account_id: 'acc_vertex_123',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_WH001',
            entity: 'payment',
            amount: 14000,
            currency: 'INR',
            status: 'captured',
            order_id: 'order_WH001',
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    });

    const rawBuffer = Buffer.from(webhookPayload, 'utf-8');
    const validWebhookSig = generateWebhookSignature(rawBuffer, webhookSecret);
    assert.equal(validWebhookSig.length, 64);

    // Valid webhook verification
    const isValid = verifyWebhookSignature(rawBuffer, validWebhookSig, webhookSecret);
    assert.equal(isValid, true, 'Valid webhook raw body must verify successfully');

    // Tampered payload: modify amount from 14000 to 1400
    const tamperedPayload = webhookPayload.replace('14000', '1400');
    const tamperedBuffer = Buffer.from(tamperedPayload, 'utf-8');
    const isTamperedValid = verifyWebhookSignature(tamperedBuffer, validWebhookSig, webhookSecret);
    assert.equal(isTamperedValid, false, 'Tampered webhook payload must fail verification');

    // Tampered payload: append a single trailing space (whitespace sensitivity)
    const whitespaceBuffer = Buffer.from(webhookPayload + ' ', 'utf-8');
    assert.equal(verifyWebhookSignature(whitespaceBuffer, validWebhookSig, webhookSecret), false, 'Whitespace modification must fail HMAC');
  });

  it('1.7: Length-mismatch timing attack resilience in timingSafeEqual', () => {
    // Demonstrates that crypto.timingSafeEqual throws RangeError if buffer lengths differ
    const buf64 = Buffer.from('a'.repeat(64), 'utf8');
    const buf32 = Buffer.from('a'.repeat(32), 'utf8');

    assert.throws(
      () => crypto.timingSafeEqual(buf32, buf64),
      /Input buffers must have the same byte length/,
      'Direct timingSafeEqual call on unequal lengths must throw RangeError',
    );

    // Safe implementation must guard length before timingSafeEqual
    function safeTimingEqual(a, b) {
      const bufA = Buffer.from(a, 'utf8');
      const bufB = Buffer.from(b, 'utf8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    }

    assert.equal(safeTimingEqual('short', 'a'.repeat(64)), false);
    assert.equal(safeTimingEqual('a'.repeat(64), 'a'.repeat(64)), true);
  });
});

// ============================================================================
// SUITE 2: Razorpay Order Creation Validation Stress Testing
// ============================================================================
describe('M1 Empirical Challenge: Order Creation Validation & Attack Scenarios', () => {
  let server;
  const validProduct = CATALOG_FIXTURES[0];
  const validVariant = validProduct.variants[0];

  test.beforeEach(() => {
    server = new ServerRuntimeSimulator();
  });

  it('2.1: Rejects empty, missing, or non-array items array with 400', () => {
    const emptyCases = [
      { items: [] },
      { items: null },
      { items: undefined },
      { items: 'not an array' },
      { items: {} },
    ];

    for (const testCase of emptyCases) {
      const res = server.createRazorpayOrder({
        items: testCase.items,
        shippingAddress: { fullName: 'Alex Mercer', postalCode: '90210' },
      });
      assert.equal(res.success, false, `Items ${JSON.stringify(testCase.items)} must be rejected`);
      assert.equal(res.status, 400);
      assert.match(res.error, /at least one item/);
    }
  });

  it('2.2: Rejects negative, zero, and fractional quantities with 400', () => {
    const invalidQuantities = [-1, -10, 0, 1.5, 3.8, NaN, Infinity, -Infinity];

    for (const qty of invalidQuantities) {
      const res = server.createRazorpayOrder({
        items: [{ productId: validProduct._id, variantId: validVariant.id, quantity: qty }],
        shippingAddress: { fullName: 'Alex Mercer', postalCode: '90210' },
      });

      assert.equal(res.success, false, `Quantity ${qty} must be rejected with 400`);
      assert.equal(res.status, 400);
      assert.match(res.error, /Invalid quantity/);
    }
  });

  it('2.3: Neutralizes client-injected price tampering (negative, zero, or discounted)', () => {
    // Attacker sends client item with price: -500 or price: 0.01
    const res = server.createRazorpayOrder({
      items: [
        {
          productId: validProduct._id,
          variantId: validVariant.id,
          quantity: 1,
          price: -500.0, // Client tries to inject negative price
        },
      ],
      shippingAddress: { fullName: 'Alex Mercer', postalCode: '90210' },
    });

    assert.equal(res.success, true);
    // Catalog price is $148.00 (from seed data)
    assert.equal(res.data.breakdown.subtotal, validProduct.price, 'Subtotal must equal authoritative catalog price');
    assert.ok(res.data.amount > 0, 'Calculated paise amount must be strictly positive');
  });

  it('2.4: Rejects orders exceeding available inventory stock', () => {
    const requestedQty = validVariant.stock + 1; // 40 + 1 = 41
    const res = server.createRazorpayOrder({
      items: [{ productId: validProduct._id, variantId: validVariant.id, quantity: requestedQty }],
      shippingAddress: { fullName: 'Alex Mercer', postalCode: '90210' },
    });

    assert.equal(res.success, false);
    assert.equal(res.status, 400);
    assert.match(res.error, /Insufficient stock/);
  });

  it('2.5: Rejects missing shipping address or postalCode with 400', () => {
    const invalidAddresses = [
      null,
      undefined,
      {},
      { fullName: '' },
      { fullName: 'Alex', postalCode: '' },
    ];

    for (const addr of invalidAddresses) {
      const res = server.createRazorpayOrder({
        items: [{ productId: validProduct._id, variantId: validVariant.id, quantity: 1 }],
        shippingAddress: addr,
      });

      assert.equal(res.success, false, `Address ${JSON.stringify(addr)} must be rejected`);
      assert.equal(res.status, 400);
      assert.match(res.error, /shipping address required/i);
    }
  });

  it('2.6: Ensures currency amount in paise eliminates float precision errors', () => {
    // Test tricky decimal amounts
    const decimalItems = [
      { price: 19.99, quantity: 3 }, // 59.97
      { price: 0.01, quantity: 1 },  // 0.01
      { price: 149.99, quantity: 1 }, // exactly $0.01 below free shipping threshold
    ];

    for (const item of decimalItems) {
      const metrics = calculateCartMetrics([item]);
      assert.equal(Number.isInteger(metrics.amountPaise), true, `Paise amount ${metrics.amountPaise} must be integer`);
      assert.equal(Number.isFinite(metrics.amountPaise), true);
      assert.ok(metrics.amountPaise > 0);
    }
  });
});

// ============================================================================
// SUITE 3: @vertex/types Compilation, Resolution & Type Safety
// ============================================================================
describe('M1 Empirical Challenge: @vertex/types Compilation & Type Safety', () => {
  it('3.1: CommonJS can require @vertex/types cleanly', () => {
    const typesModule = require('@vertex/types');
    assert.ok(typesModule, '@vertex/types must export an object');
    assert.equal(typeof typesModule.FREE_SHIPPING_THRESHOLD, 'number');
    assert.equal(typesModule.FREE_SHIPPING_THRESHOLD, 150);
    assert.ok(Array.isArray(typesModule.PRODUCT_CATEGORIES));
    assert.ok(Array.isArray(typesModule.SIZES));
  });

  it('3.2: ESM can import @vertex/types cleanly', async () => {
    const typesEsm = await import('@vertex/types');
    assert.ok(typesEsm, '@vertex/types must be importable as ESM');
    assert.equal(typesEsm.FREE_SHIPPING_THRESHOLD, 150);
  });

  it('3.3: TypeScript compiler verifies schema contracts without error', () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/types-contract-test.ts');
    assert.ok(fs.existsSync(fixturePath), 'Fixture file must exist');

    const rootDir = path.resolve(__dirname, '..');
    const result = execSync(
      `npx tsc "${fixturePath}" --noEmit --skipLibCheck --target ES2022 --moduleResolution node`,
      { cwd: rootDir, encoding: 'utf-8' },
    );
    assert.equal(result.trim(), '', 'TypeScript compilation of contracts must produce zero diagnostics');
  });

  it('3.4: TypeScript catches intentional invalid type assignments', () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/invalid-type-test.ts');
    assert.ok(fs.existsSync(fixturePath), 'Fixture file must exist');

    let failedAsExpected = false;
    const rootDir = path.resolve(__dirname, '..');
    try {
      execSync(
        `npx tsc "${fixturePath}" --noEmit --skipLibCheck --target ES2022 --moduleResolution node`,
        { cwd: rootDir, encoding: 'utf-8', stdio: 'pipe' },
      );
    } catch (err) {
      failedAsExpected = true;
      const combinedOutput = (err.stdout || '') + (err.stderr || '') + (err.message || '');
      assert.match(
        combinedOutput,
        /Type '"not_a_valid_status"' is not assignable to type 'PaymentStatus'/,
        'TypeScript compiler must flag invalid type assignment',
      );
    }

    assert.equal(failedAsExpected, true, 'Compiler must fail on invalid PaymentStatus assignment');
  });
});

// ============================================================================
// SUITE 4: Production Implementation Vulnerability Audit (apps/api)
// ============================================================================
describe('M1 Empirical Challenge: Production Implementation Audit (apps/api)', () => {
  it('4.1: Audit orders.routes.ts for negative quantity validation', () => {
    const ordersRoutesPath = path.resolve(__dirname, '../apps/api/src/routes/orders.routes.ts');
    const content = fs.readFileSync(ordersRoutesPath, 'utf-8');

    // Check if orders.routes.ts validates quantity <= 0 or non-integer
    const hasQuantityCheck = content.includes('item.quantity <= 0') ||
                             content.includes('quantity <= 0') ||
                             content.includes('Number.isInteger(item.quantity)');

    // CHALLENGE FINDING: In apps/api/src/routes/orders.routes.ts,
    // quantity <= 0 is NOT validated prior to subtotal calculation!
    // We document this empirical observation.
    if (!hasQuantityCheck) {
      console.warn('[VULNERABILITY WARNING] apps/api/src/routes/orders.routes.ts lacks explicit check for quantity <= 0 or integer validation!');
    }
    // We assert our observation accurately reflects the file
    assert.equal(hasQuantityCheck, false, 'Confirmed: orders.routes.ts currently lacks item.quantity <= 0 validation');
  });

  it('4.2: Audit orders.routes.ts for constant-time HMAC comparison', () => {
    const ordersRoutesPath = path.resolve(__dirname, '../apps/api/src/routes/orders.routes.ts');
    const content = fs.readFileSync(ordersRoutesPath, 'utf-8');

    const usesTimingSafe = content.includes('timingSafeEqual');
    if (!usesTimingSafe) {
      console.warn('[ADVISORY] apps/api/src/routes/orders.routes.ts uses === instead of crypto.timingSafeEqual for signature verification');
    }
    assert.equal(usesTimingSafe, false, 'Confirmed: orders.routes.ts currently uses string === comparison');
  });
});
