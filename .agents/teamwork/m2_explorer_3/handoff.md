# Security Hardening & Implementation Plan for Razorpay Routes (Milestone 2)

**Agent**: `m2_explorer_3` (teamwork_preview_explorer)  
**Roles**: Security & Razorpay Routes Specialist  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_3`  
**Target Milestone**: Milestone 2: Backend API & Razorpay Payment Engine  
**Date**: 2026-10-04  

---

## 1. Observation

### 1.1 Source Code Observations in `apps/api/src/routes/orders.routes.ts`

1. **Vulnerability 1.1: Missing Positive Integer Validation on `item.quantity`**
   - **File**: `apps/api/src/routes/orders.routes.ts` (lines 30–73, inside `createOrderHandler`):
     ```typescript
     30: if (!items || !Array.isArray(items) || items.length === 0) {
     31:   next(new AppError('Order must contain at least one item', 400));
     32:   return;
     33: }
     ...
     55: if (variant.stock < item.quantity) {
     56:   next(new AppError(`Insufficient stock for ${product.name} (${variant.sku})`, 400));
     57:   return;
     58: }
     59: 
     60: const itemPrice = variant.price;
     61: subtotal += itemPrice * item.quantity;
     ```
   - **File**: `apps/api/src/routes/orders.routes.ts` (lines 217–258, inside `POST /api/orders` direct order placement):
     ```typescript
     217: router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
     218:   try {
     219:     const { items, shippingAddress, ... } = req.body;
     220:     const order = await Order.create({ ... });
     ```
   - **Verbatim Finding**: Neither handler verifies `Number.isInteger(item.quantity)` or `item.quantity > 0`. If `item.quantity` is negative (e.g. `-5`), `variant.stock < -5` evaluates to `false`, deducting from `subtotal` and later in inventory decrement (`Product.updateOne(..., { $inc: { 'variants.$.stock': -item.quantity } })`) increasing product stock by 5 units (`-(-5) = +5`). If `item.quantity` is a float (e.g. `1.5`), fractional inventory counts are persisted to MongoDB.

2. **Vulnerability 1.2: Standard String `===` Equality in Payment Verification**
   - **File**: `apps/api/src/routes/orders.routes.ts` (lines 163–174):
     ```typescript
     163: // Verify HMAC-SHA256 signature
     164: const hmacBody = `${razorpayOrderId}|${razorpayPaymentId}`;
     165: const expectedSignature = crypto
     166:   .createHmac('sha256', RAZORPAY_KEY_SECRET)
     167:   .update(hmacBody)
     168:   .digest('hex');
     169: 
     170: const isValid = expectedSignature === razorpaySignature;
     171: if (!isValid) {
     172:   next(new AppError('Invalid payment signature', 400));
     173:   return;
     174: }
     ```
   - **Verbatim Finding**: Standard JavaScript equality comparison (`===`) terminates evaluation at the first mismatched byte, creating a timing side-channel where attackers can incrementally deduce valid HMAC signature bytes based on microsecond latency variations.

3. **Vulnerability 1.3: Non-Existent Order Returns HTTP 200 Instead of HTTP 404**
   - **File**: `apps/api/src/routes/orders.routes.ts` (lines 176–211):
     ```typescript
     176: // Update internal Order
     177: const query = orderId && mongoose.isValidObjectId(orderId)
     178:   ? { _id: orderId }
     179:   : { razorpayOrderId };
     180: 
     181: const order = await Order.findOneAndUpdate(
     182:   query,
     183:   {
     184:     razorpayPaymentId,
     185:     razorpaySignature,
     186:     paymentStatus: 'captured',
     187:     status: 'confirmed',
     188:   },
     189:   { new: true },
     190: );
     191: 
     192: if (order) {
     193:   // Decrement inventory stock
     194:   for (const item of order.items) {
     195:     await Product.updateOne(
     196:       { _id: item.productId, 'variants.sku': item.sku },
     197:       { $inc: { 'variants.$.stock': -item.quantity } },
     198:     );
     199:   }
     200: }
     201: 
     202: res.json({
     203:   success: true,
     204:   message: 'Payment verified successfully',
     205:   data: {
     206:     orderId: order?._id ?? orderId,
     207:     razorpayOrderId,
     208:     status: 'captured',
     209:   },
     210: });
     ```
   - **Verbatim Finding**: If `order` is `null` (because `orderId` or `razorpayOrderId` does not exist in the database), the route silently skips stock decrement but still returns HTTP 200 `{ success: true, message: 'Payment verified successfully' }` with `orderId: undefined ?? orderId`. It fails to reject the unknown order with HTTP 404 Not Found.
   - **Additional Finding**: If `verify-payment` is invoked repeatedly on an already confirmed order, `findOneAndUpdate` does not check prior status, which would re-decrement stock if not guarded.

---

### 1.2 Source Code Observations in `apps/api/src/routes/webhooks.routes.ts` & `server.ts`

1. **Vulnerability 2.1: Crash Risk & Mutation on Empty or Non-Buffer Webhook Body**
   - **File**: `apps/api/src/routes/webhooks.routes.ts` (lines 20–27):
     ```typescript
     20: let rawBody: Buffer;
     21: if (Buffer.isBuffer(req.body)) {
     22:   rawBody = req.body;
     23: } else if (typeof req.body === 'string') {
     24:   rawBody = Buffer.from(req.body, 'utf-8');
     25: } else {
     26:   rawBody = Buffer.from(JSON.stringify(req.body), 'utf-8');
     27: }
     ```
   - **Verbatim Finding**: If a webhook request arrives with an empty/undefined body, `JSON.stringify(undefined)` returns `undefined`. `Buffer.from(undefined)` throws an unhandled `TypeError [ERR_INVALID_ARG_TYPE]` causing an unexpected 500 crash. Furthermore, `JSON.stringify` re-serializes JSON with non-deterministic key ordering and whitespace differences, causing valid Razorpay webhook signatures to fail.
   - **File**: `apps/api/src/server.ts` (line 28):
     ```typescript
     28: app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
     ```
     If the webhook delivery from Razorpay or an intermediary proxy arrives with Content-Type variations (e.g. missing header or `application/json; charset=utf-8`), `express.raw` does not match, causing body corruption.

2. **Vulnerability 2.2: Standard Inequality `!==` on Webhook Signature**
   - **File**: `apps/api/src/routes/webhooks.routes.ts` (lines 29–38):
     ```typescript
     29: const expectedSignature = crypto
     30:   .createHmac('sha256', webhookSecret)
     31:   .update(rawBody)
     32:   .digest('hex');
     33: 
     34: if (expectedSignature !== signature) {
     35:   console.error('Razorpay webhook HMAC signature verification failed');
     36:   res.status(400).json({ error: 'Invalid signature' });
     37:   return;
     38: }
     ```
   - **Verbatim Finding**: Uses non-constant-time comparison `expectedSignature !== signature`. When replacing with `crypto.timingSafeEqual`, input buffer lengths must be strictly validated first, otherwise Node.js throws `RangeError: Input buffers must have the same byte length`.

3. **Vulnerability 2.3: Lack of Webhook Idempotency & Duplicate Protection**
   - **File**: `apps/api/src/routes/webhooks.routes.ts` (lines 49–97):
     ```typescript
     49: try {
     50:   switch (event.event) {
     51:     case 'payment.captured': {
     52:       const payment = event.payload.payment?.entity;
     53:       if (payment?.order_id) {
     54:         await Order.findOneAndUpdate(
     55:           { razorpayOrderId: payment.order_id },
     56:           {
     57:             razorpayPaymentId: payment.id,
     58:             paymentStatus: 'captured',
     59:             status: 'confirmed',
     60:           },
     61:         );
     62:       }
     63:       break;
     64:     }
     ...
     ```
   - **Verbatim Finding**: Webhook events have unique IDs (`event.id` or `event.event_id`). Razorpay actively retries webhook delivery upon network delays. The current code has no record of processed event IDs and does not inspect the current order status prior to applying state updates. In a race condition where a delayed `payment.failed` arrives after an order is already `captured`, the status would be overwritten from confirmed to cancelled.

---

### 1.3 Test Suite & Benchmark Observations

1. **E2E Test Runner**:
   - Command: `node tests/runner.mjs`
   - Output: 99 / 99 tests passing across Tiers 1–4 with exit code 0.
2. **Boundary Stress Suite**:
   - Command: `node --test tests/boundary-stress.test.mjs`
   - Output: 16 / 16 tests passing with exit code 0.
3. **M1 Empirical Challenge Suite**:
   - Command: `node --test tests/m1-empirical-challenge.test.mjs`
   - Output: 19 / 19 tests passing.
   - Specifically logged M1 advisories:
     ```
     [VULNERABILITY WARNING] apps/api/src/routes/orders.routes.ts lacks explicit check for quantity <= 0 or integer validation!
     [ADVISORY] apps/api/src/routes/orders.routes.ts uses === instead of crypto.timingSafeEqual for signature verification
     ```
4. **Test Harness Vulnerability (`tests/harness/contracts.mjs`)**:
   - Lines 120–136 call `crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))` without guarding buffer length. When `signature.length !== 64`, it throws `RangeError`, which `ServerRuntimeSimulator` only survives due to wrapping `try/catch`. Adding length guards directly in `contracts.mjs` eliminates `RangeError` entirely.

---

## 2. Logic Chain

1. **Step 1: Security Risk of Non-Integer and Non-Positive Quantities (Ref: Observation 1.1)**:
   - An attacker submitting `{ productId: '...', quantity: -3 }` causes `variant.stock < -3` to evaluate to `false`.
   - The subtotal formula `subtotal += itemPrice * item.quantity` subtracts `itemPrice * 3` from the order subtotal.
   - When order confirmation triggers inventory decrement `{ $inc: { 'variants.$.stock': -(-3) } }`, product stock increases by 3 units, creating inventory manipulation and price exploitation.
   - Enforcing `typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0` rejects negative numbers, zero, floats, `NaN`, and `Infinity` immediately with HTTP 400 Bad Request.

2. **Step 2: Cryptographic Timing Side-Channel Defense (Ref: Observation 1.2 & 2.2)**:
   - Comparing cryptographic hex digests using standard string comparison (`===` or `!==`) terminates early on the first mismatched character.
   - Attackers sending hundreds of thousands of trial signatures over low-latency connections can measure response duration differences to progressively reconstruct authentic HMAC signatures byte by byte.
   - Node.js provides `crypto.timingSafeEqual(bufA, bufB)` for constant-time evaluation across all bytes regardless of matching prefixes.
   - Crucially, `crypto.timingSafeEqual` throws `RangeError: Input buffers must have the same byte length` if buffer lengths differ. Therefore, a precondition `bufA.length === bufB.length` must be checked before calling `timingSafeEqual`. If lengths differ, evaluation returns `false` without throwing an exception.

3. **Step 3: Missing Order Integrity in Payment Verification (Ref: Observation 1.3)**:
   - If an order ID does not exist in the database, returning HTTP 200 `{ success: true, message: 'Payment verified successfully' }` misleads client applications and payment workflows into confirming transactions for ghost orders.
   - Querying `Order.findOne(query)` and immediately rejecting with HTTP 404 (`Order not found`) guarantees state consistency.
   - Checking whether `existingOrder.paymentStatus === 'captured'` or `existingOrder.status === 'confirmed'` prior to updating guarantees idempotency: repeat calls return HTTP 200 without duplicate stock decrementations.

4. **Step 4: Raw Body Buffer Resilience (Ref: Observation 2.1)**:
   - In Express, if `express.raw` fails to parse or a request has no body, `req.body` is `undefined`.
   - `Buffer.from(JSON.stringify(undefined))` throws a fatal `TypeError` outside `try/catch`.
   - Furthermore, `JSON.stringify` does not preserve byte-for-byte fidelity with the payload signed by Razorpay.
   - Validating `if (!req.body) return res.status(400)` and accepting only `Buffer` or raw `string`, plus setting `express.raw({ type: '*/*' })` on `/api/webhooks/razorpay` in `server.ts`, guarantees crash-free raw byte preservation.

5. **Step 5: Webhook Idempotency & Race Protection (Ref: Observation 2.3)**:
   - Razorpay delivers webhooks at-least-once. Duplicate deliveries of `payment.captured` or `order.paid` will occur during temporary network latency.
   - Maintaining an in-memory cache of processed event IDs (capped to prevent memory leakage) plus database-level status inspection ensures duplicate events return HTTP 200 `{ status: 'ok', received: true, idempotent: true }` without redundant DB writes.
   - Additionally, guarding `payment.failed` against overwriting already-captured orders prevents out-of-order delivery race conditions.

---

## 3. Concrete Implementation Plan for Worker

The worker implementing Milestone 2 must apply the following exact changes:

### Task 1: Update `apps/api/src/routes/orders.routes.ts`

#### 1.1 Add strict quantity validation in `createOrderHandler` and `router.post('/')`
In `createOrderHandler` (around line 38, inside the item loop):
```typescript
for (const item of items) {
  // Strict quantity validation: must be a positive integer
  if (
    typeof item.quantity !== 'number' ||
    !Number.isInteger(item.quantity) ||
    item.quantity <= 0
  ) {
    next(new AppError(`Invalid quantity for item ${item.productId}. Quantity must be a positive integer`, 400));
    return;
  }

  const product = await Product.findById(item.productId);
  ...
```

In `router.post('/')` (around line 217):
```typescript
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, razorpayOrderId, razorpayPaymentId, razorpaySignature, subtotal, shipping, tax, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      next(new AppError('Order must contain at least one item', 400));
      return;
    }

    for (const item of items) {
      if (
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        next(new AppError(`Invalid quantity for item ${item.productId}. Quantity must be a positive integer`, 400));
        return;
      }
    }
```

#### 1.2 Hardening `/razorpay/verify-payment`: Timing-Safe HMAC & Buffer Length Check
Replace lines 163–174 with:
```typescript
    // Verify HMAC-SHA256 signature using timing-safe comparison
    const hmacBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(hmacBody)
      .digest('hex');

    if (typeof razorpaySignature !== 'string') {
      next(new AppError('Invalid payment signature format', 400));
      return;
    }

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(razorpaySignature, 'utf8');

    // Buffer length check is mandatory before crypto.timingSafeEqual to prevent RangeError
    const isValid =
      expectedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(expectedBuf, signatureBuf);

    if (!isValid) {
      next(new AppError('Invalid payment signature', 400));
      return;
    }
```

#### 1.3 Hardening `/razorpay/verify-payment`: Non-Existent Order 404 & Idempotency
Replace lines 176–213 with:
```typescript
    // Update internal Order
    const query = orderId && mongoose.isValidObjectId(orderId)
      ? { _id: orderId }
      : { razorpayOrderId };

    const existingOrder = await Order.findOne(query);

    if (!existingOrder) {
      next(new AppError('Order not found', 404));
      return;
    }

    // Idempotency: if already confirmed/captured, return success without duplicate stock decrement
    if (existingOrder.paymentStatus === 'captured' || existingOrder.status === 'confirmed') {
      res.json({
        success: true,
        message: 'Payment already verified',
        data: {
          orderId: existingOrder._id,
          razorpayOrderId: existingOrder.razorpayOrderId ?? razorpayOrderId,
          status: existingOrder.paymentStatus,
        },
      });
      return;
    }

    existingOrder.razorpayPaymentId = razorpayPaymentId;
    existingOrder.razorpaySignature = razorpaySignature;
    existingOrder.paymentStatus = 'captured';
    existingOrder.status = 'confirmed';
    await existingOrder.save();

    // Decrement inventory stock safely once
    for (const item of existingOrder.items) {
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.sku },
        { $inc: { 'variants.$.stock': -item.quantity } },
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: existingOrder._id,
        razorpayOrderId: existingOrder.razorpayOrderId ?? razorpayOrderId,
        status: 'captured',
      },
    });
```

---

### Task 2: Update `apps/api/src/server.ts`

In `apps/api/src/server.ts` (line 28):
Replace:
```typescript
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
```
With:
```typescript
// Razorpay webhook needs raw body buffer for HMAC-SHA256 verification — preserve raw buffer for all content types
app.use('/api/webhooks/razorpay', express.raw({ type: '*/*' }));
```

---

### Task 3: Update `apps/api/src/routes/webhooks.routes.ts`

Replace the entire handler in `apps/api/src/routes/webhooks.routes.ts` with the following hardened implementation:

```typescript
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order.model';
import { RAZORPAY_WEBHOOK_SECRET } from '../config/razorpay';
import type { RazorpayWebhookEvent } from '@vertex/types';

const router = Router();

// In-memory idempotency cache for recent webhook event IDs (capped to prevent memory leaks)
const processedWebhookEventIds = new Set<string>();
const MAX_PROCESSED_EVENTS = 10000;

function recordProcessedEvent(eventId: string): void {
  if (processedWebhookEventIds.size >= MAX_PROCESSED_EVENTS) {
    const oldestKey = processedWebhookEventIds.values().next().value;
    if (oldestKey) processedWebhookEventIds.delete(oldestKey);
  }
  processedWebhookEventIds.add(eventId);
}

// POST /api/webhooks/razorpay — raw body Buffer preserved in server.ts
router.post('/razorpay', async (req: Request, res: Response): Promise<void> => {
  const signatureHeader = req.headers['x-razorpay-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET;

  if (!signature || typeof signature !== 'string' || !webhookSecret) {
    res.status(400).json({ error: 'Missing x-razorpay-signature header or webhook secret' });
    return;
  }

  // 1. Safeguard against missing, empty, or non-buffer raw bodies
  if (!req.body) {
    res.status(400).json({ error: 'Empty or missing webhook body' });
    return;
  }

  let rawBody: Buffer;
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body;
  } else if (typeof req.body === 'string') {
    rawBody = Buffer.from(req.body, 'utf-8');
  } else {
    res.status(400).json({ error: 'Malformed webhook payload. Expected raw buffer or string.' });
    return;
  }

  if (rawBody.length === 0) {
    res.status(400).json({ error: 'Empty webhook body' });
    return;
  }

  // 2. Timing-safe HMAC verification with buffer length check
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  const isSignatureValid =
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf);

  if (!isSignatureValid) {
    console.error('Razorpay webhook HMAC signature verification failed');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // 3. Safe JSON parsing of raw body
  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody.toString('utf-8')) as RazorpayWebhookEvent;
  } catch (err) {
    console.error('Failed to parse Razorpay webhook payload:', err);
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  if (!event || typeof event !== 'object' || !event.event) {
    res.status(400).json({ error: 'Invalid event structure' });
    return;
  }

  const eventId = (event as any).id || (event as any).event_id;

  // 4. Webhook Idempotency Check: reject duplicate event IDs cleanly with 200
  if (eventId && processedWebhookEventIds.has(eventId)) {
    res.json({
      status: 'ok',
      received: true,
      idempotent: true,
      message: `Event ${eventId} already processed`,
    });
    return;
  }

  try {
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment?.entity;
        if (payment?.order_id) {
          const existingOrder = await Order.findOne({ razorpayOrderId: payment.order_id });
          if (existingOrder) {
            // Idempotency guard: order already captured
            if (existingOrder.paymentStatus === 'captured') {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${payment.order_id} already captured`,
              });
              return;
            }

            existingOrder.razorpayPaymentId = payment.id;
            existingOrder.paymentStatus = 'captured';
            existingOrder.status = 'confirmed';
            await existingOrder.save();
          }
        }
        break;
      }

      case 'order.paid': {
        const orderEntity = event.payload.order?.entity;
        if (orderEntity?.id) {
          const existingOrder = await Order.findOne({ razorpayOrderId: orderEntity.id });
          if (existingOrder) {
            if (existingOrder.paymentStatus === 'captured') {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${orderEntity.id} already captured`,
              });
              return;
            }

            existingOrder.paymentStatus = 'captured';
            existingOrder.status = 'confirmed';
            await existingOrder.save();
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity;
        if (payment?.order_id) {
          const existingOrder = await Order.findOne({ razorpayOrderId: payment.order_id });
          if (existingOrder) {
            // Guard: Do not overwrite an already captured order with an out-of-order failure
            if (existingOrder.paymentStatus === 'captured') {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${payment.order_id} already captured; ignoring out-of-order payment.failed`,
              });
              return;
            }

            if (existingOrder.paymentStatus === 'failed') {
              if (eventId) recordProcessedEvent(eventId);
              res.json({
                status: 'ok',
                received: true,
                idempotent: true,
                message: `Order ${payment.order_id} already marked failed`,
              });
              return;
            }

            existingOrder.razorpayPaymentId = payment.id;
            existingOrder.paymentStatus = 'failed';
            existingOrder.status = 'cancelled';
            await existingOrder.save();
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    if (eventId) {
      recordProcessedEvent(eventId);
    }

    res.json({ status: 'ok', received: true, processed: true });
  } catch (err) {
    console.error('Error processing Razorpay webhook event:', err);
    res.status(500).json({ error: 'Internal server error processing webhook' });
  }
});

export default router;
```

---

### Task 4: Defensive Hardening in `tests/harness/contracts.mjs`

To prevent `RangeError` from bubbling in test harness utilities if malformed signatures are tested directly:
In `tests/harness/contracts.mjs` (lines 120–136):
```javascript
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
```

---

## 4. Caveats

1. **Active MongoDB Instance for Live API**:
   - `apps/api` runs against MongoDB via Mongoose. In local development or testing without MongoDB running, tests utilize `tests/harness/server-runtime.mjs`. For live integration runs of `apps/api/src/server.ts`, MongoDB (Docker or local) or `mongodb-memory-server` is required.
2. **`m1-empirical-challenge.test.mjs` Suite 4 Assertions**:
   - Note that in `tests/m1-empirical-challenge.test.mjs`, tests 4.1 and 4.2 specifically assert that the file *lacked* these checks in M1 (`assert.equal(hasQuantityCheck, false)` and `assert.equal(usesTimingSafe, false)`).
   - Once the worker applies the hardening in M2, those assertions in `m1-empirical-challenge.test.mjs` should either be updated to `true` (verifying the vulnerabilities are eliminated) or a dedicated `tests/m2-empirical-challenge.test.mjs` should be created to assert positive protection.
   - The primary E2E runner (`node tests/runner.mjs`) is unaffected and will remain 100% passing.
3. **Webhook Distributed Idempotency**:
   - The in-memory LRU-like set (`processedWebhookEventIds`) provides high-performance, single-instance idempotency. In a multi-replica clustered production deployment, this can be complemented with a MongoDB TTL collection (`ProcessedWebhook`).

---

## 5. Conclusion

1. The vulnerabilities identified by M1 reviewers and challengers in `apps/api/src/routes/orders.routes.ts` and `apps/api/src/routes/webhooks.routes.ts` have been comprehensively traced and analyzed.
2. A turnkey, drop-in implementation plan has been formulated for the Milestone 2 worker:
   - **Timing-Safe HMAC Verification**: Length-guarded `crypto.timingSafeEqual` in both orders and webhooks routes.
   - **Integer & Positive Quantity Validation**: Strict check `typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0` rejecting negative, zero, or floating quantities with HTTP 400.
   - **Non-Existent Order 404**: Rejects missing orders with HTTP 404 in `/razorpay/verify-payment`.
   - **Raw Body Buffer Safety**: Rejects empty bodies with 400, avoids `JSON.stringify` mutations, catches undefined buffers, and handles `*/*` content types in `server.ts`.
   - **Webhook & Payment Idempotency**: Prevents double inventory decrements and ignores late out-of-order `payment.failed` webhooks on already-captured orders.

---

## 6. Verification Method

To verify this implementation plan:

1. **Verify API TypeScript Compilation**:
   ```powershell
   npm run --workspace=@vertex/api build
   npm run --workspace=@vertex/api type-check
   ```
   *Expected outcome*: Exits with code 0; zero compiler diagnostics.

2. **Run Full Turborepo Pipeline**:
   ```powershell
   npx turbo run build type-check --filter=@vertex/types --filter=@vertex/api
   ```
   *Expected outcome*: Tasks: 2 successful, 2 total (code 0).

3. **Run E2E Test Suite**:
   ```powershell
   node tests/runner.mjs
   ```
   *Expected outcome*: Exits with code 0; all 99 tests across Tiers 1–4 passing (100% coverage).

4. **Run Adversarial Boundary Stress Suite**:
   ```powershell
   node --test tests/boundary-stress.test.mjs
   ```
   *Expected outcome*: Exits with code 0; 16/16 tests passing.

5. **Verify Route Hardening via Code Inspection**:
   Inspect `apps/api/src/routes/orders.routes.ts` and `apps/api/src/routes/webhooks.routes.ts` to confirm:
   - `crypto.timingSafeEqual` is preceded by `expectedBuf.length === signatureBuf.length`.
   - `Number.isInteger(item.quantity) && item.quantity > 0` is enforced before price/subtotal calculation.
   - `Order.findOne` returns HTTP 404 if order is not found in `/razorpay/verify-payment`.
   - `processedWebhookEventIds.has(eventId)` returns HTTP 200 with `{ idempotent: true }`.
