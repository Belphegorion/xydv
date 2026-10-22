/**
 * M2 Razorpay Security Hardening Empirical Adversarial Challenge Suite
 * Authored by m2_challenger_2 (teamwork_preview_challenger)
 *
 * Empirically stress-tests:
 * 1. Quantity input validation in order creation (negative -1, non-integer 1.5, strings, 0, NaN rejected with HTTP 400).
 * 2. timingSafeEqual buffer comparison under mismatched buffer lengths (verify no RangeError thrown on short, long, or malformed signatures).
 * 3. Payment verification of non-existent orders with valid HMAC signatures (verify returns HTTP 404).
 * 4. Webhook event duplicate delivery and order capture idempotency (verify HTTP 200 idempotent response without duplication).
 *
 * Verifies both:
 * - Live Express production API routes (apps/api/src/routes) mounted with MongoDB backing
 * - ServerRuntimeSimulator & contracts harness (tests/harness/)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';

// Import production API modules
import ordersRouterModule from '../apps/api/dist/routes/orders.routes.js';
import webhooksRouterModule from '../apps/api/dist/routes/webhooks.routes.js';
import { errorHandler } from '../apps/api/dist/middleware/errorHandler.js';
import {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from '../apps/api/dist/config/razorpay.js';
import { Order } from '../apps/api/dist/models/Order.model.js';
import { Product } from '../apps/api/dist/models/Product.model.js';

// Import test harness runtime & contracts
import { ServerRuntimeSimulator } from './harness/server-runtime.mjs';
import {
  verifyRazorpaySignature,
  verifyWebhookSignature,
  generateRazorpaySignature,
  generateWebhookSignature,
} from './harness/contracts.mjs';
import { CATALOG_FIXTURES } from './harness/seed-data.mjs';

const ordersRouter =
  ordersRouterModule.default?.default || ordersRouterModule.default || ordersRouterModule;
const webhooksRouter =
  webhooksRouterModule.default?.default || webhooksRouterModule.default || webhooksRouterModule;

describe('M2 Adversarial Challenge: Razorpay Security Hardening Empirical Verification', () => {
  let server;
  let baseUrl;
  let sampleProduct;
  let mongoConnected = false;

  before(async () => {
    // Connect to MongoDB if available
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb://localhost:27017/vertex', {
          serverSelectionTimeoutMS: 3000,
        });
      }
      mongoConnected = true;
      sampleProduct = await Product.findOne().lean();
    } catch (err) {
      console.warn('[WARN] MongoDB connection unavailable for live API test:', err.message);
    }

    // Set up Express test server with identical middleware as server.ts
    const app = express();

    // Raw body for webhooks must precede express.json()
    app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
    app.use(express.json());

    // Mount production routes
    app.use('/api/orders', ordersRouter);
    app.use('/api/webhooks', webhooksRouter);
    app.use(errorHandler);

    // Bind to ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ==========================================================================
  // SECTION 1: Quantity Validation Hardening (Negative, Non-Integer, String)
  // ==========================================================================
  describe('1. Quantity Input Validation Stress-Testing (Reject with HTTP 400)', () => {
    const invalidQuantityScenarios = [
      { label: 'Negative integer (-1)', quantity: -1 },
      { label: 'Large negative integer (-999)', quantity: -999 },
      { label: 'Non-integer float (1.5)', quantity: 1.5 },
      { label: 'Non-integer fractional float (0.25)', quantity: 0.25 },
      { label: 'String representation of integer ("1")', quantity: '1' },
      { label: 'String representation of negative ("-1")', quantity: '-1' },
      { label: 'Arbitrary text string ("five")', quantity: 'five' },
      { label: 'Zero quantity (0)', quantity: 0 },
      { label: 'NaN quantity', quantity: NaN },
      { label: 'Null quantity', quantity: null },
      { label: 'Undefined quantity', quantity: undefined },
      { label: 'Positive Infinity', quantity: Infinity },
      { label: 'Negative Infinity', quantity: -Infinity },
      { label: 'Boolean true', quantity: true },
      { label: 'Array [1]', quantity: [1] },
      { label: 'Object { value: 1 }', quantity: { value: 1 } },
    ];

    for (const scenario of invalidQuantityScenarios) {
      it(`Live Express API: Rejects ${scenario.label} with HTTP 400 Bad Request`, async () => {
        const prodId = sampleProduct?._id?.toString() || '670000000000000000000001';
        const res = await fetch(`${baseUrl}/api/orders/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [
              {
                productId: prodId,
                quantity: scenario.quantity,
              },
            ],
            shippingAddress: {
              fullName: 'Tactical Tester',
              street: '100 Void Street',
              city: 'Techopolis',
              postalCode: '10001',
              country: 'IN',
              phone: '9999999999',
            },
          }),
        });

        assert.equal(
          res.status,
          400,
          `Expected HTTP 400 for ${scenario.label}, got HTTP ${res.status}`,
        );

        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(
          data.error,
          /Invalid quantity|Quantity must be a positive integer/i,
          `Error message must indicate invalid positive integer quantity: ${data.error}`,
        );
      });
    }

    it('Simulator Runtime: Rejects negative, fractional, and invalid quantities with HTTP 400', () => {
      const sim = new ServerRuntimeSimulator();
      const product = CATALOG_FIXTURES[0];
      const variant = product.variants[0];

      for (const invalidQty of [-1, -50, 1.5, 0.99, 0, NaN, Infinity, '1', 'invalid']) {
        const res = sim.createRazorpayOrder({
          items: [{ productId: product._id, variantId: variant.id, quantity: invalidQty }],
          shippingAddress: { fullName: 'Tester', postalCode: '10001' },
        });

        assert.equal(res.success, false, `Expected failure for quantity ${invalidQty}`);
        assert.equal(res.status, 400, `Expected status 400 for quantity ${invalidQty}`);
        assert.match(res.error, /Invalid quantity/i);
      }
    });
  });

  // ==========================================================================
  // SECTION 2: timingSafeEqual Length-Mismatch & RangeError Hardening
  // ==========================================================================
  describe('2. timingSafeEqual Buffer Length Mismatch Stress-Testing (No RangeError)', () => {
    it('Demonstrates unhardened crypto.timingSafeEqual throws RangeError on length mismatch', () => {
      const expectedBuf = Buffer.from('a'.repeat(64), 'utf8');
      const mismatchedBuf = Buffer.from('a'.repeat(16), 'utf8');

      assert.throws(
        () => crypto.timingSafeEqual(expectedBuf, mismatchedBuf),
        /Input buffers must have the same byte length/,
        'Unhardened timingSafeEqual must throw RangeError when buffer lengths differ',
      );
    });

    const malformedSignatures = [
      { label: 'Empty string (0 chars)', sig: '' },
      { label: 'Single character (1 char)', sig: 'a' },
      { label: 'Truncated short hex (8 chars)', sig: 'abcdef12' },
      { label: 'Half length MD5 hex (32 chars)', sig: 'a'.repeat(32) },
      { label: 'Off-by-one short (63 chars)', sig: 'a'.repeat(63) },
      { label: 'Off-by-one long (65 chars)', sig: 'a'.repeat(65) },
      { label: 'Double length SHA512 (128 chars)', sig: 'a'.repeat(128) },
      { label: 'Overly long arbitrary string (500 chars)', sig: 'f'.repeat(500) },
    ];

    for (const testCase of malformedSignatures) {
      it(`Live Express API verify-payment: Rejects signature '${testCase.label}' with HTTP 400 and NO RangeError`, async () => {
        const res = await fetch(`${baseUrl}/api/orders/razorpay/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: 'order_test_length_guard',
            razorpayPaymentId: 'pay_test_length_guard',
            razorpaySignature: testCase.sig,
          }),
        });

        assert.equal(res.status, 400, `Expected HTTP 400 Bad Request, got HTTP ${res.status}`);

        const data = await res.json();
        assert.equal(data.success, false);
        // Crucial: Must be clean 400 Bad Request error, NOT an unhandled 500 RangeError crash
        assert.doesNotMatch(
          data.error || '',
          /RangeError|Input buffers must have the same byte length/i,
          'Must not throw or leak RangeError',
        );
        assert.match(
          data.error || '',
          /Missing payment verification parameters|Invalid payment signature/i,
        );
      });

      it(`Live Express API webhooks: Rejects signature '${testCase.label}' with HTTP 400 and NO RangeError`, async () => {
        const webhookPayload = JSON.stringify({
          entity: 'event',
          event: 'payment.captured',
          id: `evt_length_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123' } } },
        });

        const res = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': testCase.sig,
          },
          body: webhookPayload,
        });

        assert.equal(
          res.status,
          400,
          `Expected HTTP 400 for webhook signature '${testCase.label}', got HTTP ${res.status}`,
        );

        const data = await res.json();
        assert.doesNotMatch(
          JSON.stringify(data),
          /RangeError|Input buffers must have the same byte length/i,
          'Webhook must not throw or leak RangeError',
        );
      });
    }

    it('Harness contracts: verifyRazorpaySignature returns false on mismatched lengths without throwing', () => {
      for (const testCase of malformedSignatures) {
        let threw = false;
        let result = true;
        try {
          result = verifyRazorpaySignature(
            'order_test',
            'pay_test',
            testCase.sig,
            RAZORPAY_KEY_SECRET,
          );
        } catch (e) {
          threw = true;
        }

        assert.equal(
          threw,
          false,
          `verifyRazorpaySignature threw exception for '${testCase.label}'`,
        );
        assert.equal(
          result,
          false,
          `verifyRazorpaySignature must return false for '${testCase.label}'`,
        );
      }
    });

    it('Harness contracts: verifyWebhookSignature returns false on mismatched lengths without throwing', () => {
      const raw = Buffer.from('{"test":"payload"}', 'utf8');
      for (const testCase of malformedSignatures) {
        let threw = false;
        let result = true;
        try {
          result = verifyWebhookSignature(raw, testCase.sig, RAZORPAY_WEBHOOK_SECRET);
        } catch (e) {
          threw = true;
        }

        assert.equal(
          threw,
          false,
          `verifyWebhookSignature threw exception for '${testCase.label}'`,
        );
        assert.equal(
          result,
          false,
          `verifyWebhookSignature must return false for '${testCase.label}'`,
        );
      }
    });
  });

  // ==========================================================================
  // SECTION 3: Verifying Non-Existent Order Returns HTTP 404
  // ==========================================================================
  describe('3. Verifying Non-Existent Order (Returns HTTP 404 Not Found)', () => {
    it('Live Express API: Returns HTTP 404 when verifying order that does not exist in DB', async () => {
      // Construct a valid Razorpay order ID and payment ID that do not exist in the database
      const ghostOrderId = `order_ghost_${Date.now()}`;
      const ghostPaymentId = `pay_ghost_${Date.now()}`;

      // Generate a cryptographically authentic HMAC signature using the real secret
      const validHmacSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${ghostOrderId}|${ghostPaymentId}`)
        .digest('hex');

      assert.equal(validHmacSignature.length, 64);

      // Post valid HMAC signature with non-existent razorpayOrderId
      const res = await fetch(`${baseUrl}/api/orders/razorpay/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: ghostOrderId,
          razorpayPaymentId: ghostPaymentId,
          razorpaySignature: validHmacSignature,
        }),
      });

      assert.equal(
        res.status,
        404,
        `Expected HTTP 404 Not Found for non-existent order, got HTTP ${res.status}`,
      );

      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(
        data.error,
        /Order not found/i,
        `Error message must say 'Order not found', got: ${data.error}`,
      );
    });

    it('Live Express API: Returns HTTP 404 when verifying non-existent MongoDB ObjectId', async () => {
      const nonExistentMongoId = new mongoose.Types.ObjectId().toString();
      const ghostOrderId = `order_ghost_obj_${Date.now()}`;
      const ghostPaymentId = `pay_ghost_obj_${Date.now()}`;

      const validHmacSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${ghostOrderId}|${ghostPaymentId}`)
        .digest('hex');

      const res = await fetch(`${baseUrl}/api/orders/razorpay/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: nonExistentMongoId,
          razorpayOrderId: ghostOrderId,
          razorpayPaymentId: ghostPaymentId,
          razorpaySignature: validHmacSignature,
        }),
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Order not found/i);
    });

    it('Simulator Runtime: verifyPayment returns 404 for non-existent order', () => {
      const sim = new ServerRuntimeSimulator({ keySecret: RAZORPAY_KEY_SECRET });
      const ghostOrderId = 'order_ghost_sim_123';
      const ghostPaymentId = 'pay_ghost_sim_456';
      const validSig = generateRazorpaySignature(ghostOrderId, ghostPaymentId, RAZORPAY_KEY_SECRET);

      const res = sim.verifyPayment({
        razorpayOrderId: ghostOrderId,
        razorpayPaymentId: ghostPaymentId,
        razorpaySignature: validSig,
      });

      assert.equal(res.success, false);
      assert.equal(res.status, 404);
      assert.match(res.error, /Order not found/i);
    });
  });

  // ==========================================================================
  // SECTION 4: Duplicate Webhook Events (Verify Idempotency)
  // ==========================================================================
  describe('4. Webhook Idempotency & Duplicate Delivery Stress-Testing', () => {
    it('Live Express API: First webhook returns HTTP 200, second duplicate returns HTTP 200 with idempotent: true', async () => {
      const uniqueEventId = `evt_idempotent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const payloadObj = {
        entity: 'event',
        account_id: 'acc_vertex_audit',
        event: 'payment.captured',
        id: uniqueEventId,
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: `pay_idem_${Date.now()}`,
              entity: 'payment',
              amount: 16800,
              currency: 'INR',
              status: 'captured',
              order_id: `order_idem_${Date.now()}`,
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      };

      const rawBody = Buffer.from(JSON.stringify(payloadObj), 'utf8');
      const signature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      // First webhook delivery
      const res1 = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: rawBody,
      });

      assert.equal(
        res1.status,
        200,
        `First webhook delivery must return HTTP 200, got ${res1.status}`,
      );
      const data1 = await res1.json();
      assert.equal(data1.status, 'ok');
      assert.equal(data1.received, true);

      // Second duplicate delivery with IDENTICAL payload, signature, and event ID
      const res2 = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: rawBody,
      });

      assert.equal(
        res2.status,
        200,
        `Duplicate webhook delivery must return HTTP 200, got ${res2.status}`,
      );
      const data2 = await res2.json();
      assert.equal(data2.status, 'ok');
      assert.equal(data2.received, true);
      assert.equal(data2.idempotent, true, 'Duplicate webhook event must return idempotent: true');
      assert.match(
        data2.message,
        new RegExp(uniqueEventId),
        `Message must indicate event ID was already processed: ${data2.message}`,
      );
    });

    it('Live Express API: Database order status idempotency prevents duplicate capture', async () => {
      if (!mongoConnected) return;

      const testOrderId = `order_db_idem_${Date.now()}`;
      const testPaymentId = `pay_db_idem_${Date.now()}`;

      // Create an already captured order directly in MongoDB
      await Order.create({
        userId: new mongoose.Types.ObjectId(),
        items: [
          {
            productId: sampleProduct?._id || new mongoose.Types.ObjectId(),
            name: 'Test Hardening Item',
            sku: 'TEST-SKU-001',
            price: 50,
            quantity: 1,
            size: 'M',
            color: 'Void',
            image: '/products/image-4-1.jpg',
          },
        ],
        shippingAddress: {
          fullName: 'Test User',
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '10001',
          country: 'IN',
          phone: '9999999999',
        },
        subtotal: 50,
        shipping: 9.99,
        tax: 4.0,
        total: 63.99,
        status: 'confirmed',
        paymentStatus: 'captured', // ALREADY CAPTURED
        razorpayOrderId: testOrderId,
        razorpayPaymentId: testPaymentId,
      });

      // Send webhook for this already captured order (with fresh event ID)
      const payloadObj = {
        entity: 'event',
        event: 'payment.captured',
        id: `evt_db_guard_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: testPaymentId,
              order_id: testOrderId,
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payloadObj), 'utf8');
      const signature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const res = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: rawBody,
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.idempotent, true);
      assert.match(data.message, /already captured/i);
    });

    it('Simulator Runtime: Webhook duplicate delivery returns idempotent: true and HTTP 200', () => {
      const sim = new ServerRuntimeSimulator({ webhookSecret: RAZORPAY_WEBHOOK_SECRET });
      const eventId = 'evt_sim_idem_999';
      const event = {
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_sim_1', order_id: 'order_sim_1' },
          },
        },
      };
      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSignature(rawBody, RAZORPAY_WEBHOOK_SECRET);

      // Delivery 1
      const res1 = sim.processWebhook({ rawBody, signature, event });
      assert.equal(res1.success, true);
      assert.equal(res1.status, 200);
      assert.equal(res1.processed, true);

      // Delivery 2 (Duplicate)
      const res2 = sim.processWebhook({ rawBody, signature, event });
      assert.equal(res2.success, true);
      assert.equal(res2.status, 200);
      assert.equal(res2.idempotent, true);
      assert.match(res2.message, /already processed/i);
    });
  });
});
