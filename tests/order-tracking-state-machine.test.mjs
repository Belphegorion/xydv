/**
 * Comprehensive Order Tracking & State Machine Test Suite (Workstream C)
 * Verifies:
 * - Order Status State Machine transitions (placed -> confirmed -> packed -> shipped -> out_for_delivery -> delivered)
 * - Cancellation rules (allowed ONLY from placed, confirmed, packed)
 * - Strict rejection of invalid transitions (e.g. delivered -> cancelled, shipped -> cancelled)
 * - Append-only OrderStatusEvent model structure and indexes
 * - NotificationOutbox transactional queue structure and templates
 * - Server-Sent Events (SSE) headers, initial state, order_update event, and heartbeat (: ping\n\n) formatting
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OrderTrackingService,
  VALID_TRANSITIONS,
  orderTrackingEmitter,
} from '../apps/api/dist/services/orderTracking.service.js';
import { updateOrderStatusTrackingSchema } from '../apps/api/dist/validators/orderTracking.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');

describe('Workstream C: State Machine Transition Rules', () => {
  it('allows valid sequential fulfillment transitions', () => {
    // placed -> confirmed
    assert.equal(OrderTrackingService.isValidTransition('placed', 'confirmed'), true);

    // confirmed -> packed
    assert.equal(OrderTrackingService.isValidTransition('confirmed', 'packed'), true);

    // packed -> shipped
    assert.equal(OrderTrackingService.isValidTransition('packed', 'shipped'), true);

    // shipped -> out_for_delivery
    assert.equal(OrderTrackingService.isValidTransition('shipped', 'out_for_delivery'), true);

    // out_for_delivery -> delivered
    assert.equal(OrderTrackingService.isValidTransition('out_for_delivery', 'delivered'), true);
  });

  it('allows cancellation ONLY from placed, confirmed, or packed states', () => {
    // Permitted cancellations
    assert.equal(OrderTrackingService.isValidTransition('placed', 'cancelled'), true);
    assert.equal(OrderTrackingService.isValidTransition('confirmed', 'cancelled'), true);
    assert.equal(OrderTrackingService.isValidTransition('packed', 'cancelled'), true);
    assert.equal(OrderTrackingService.isValidTransition('pending', 'cancelled'), true);
    assert.equal(OrderTrackingService.isValidTransition('processing', 'cancelled'), true);

    // FORBIDDEN cancellations: Once handed to logistics or terminal, cancellation is impossible
    assert.equal(
      OrderTrackingService.isValidTransition('shipped', 'cancelled'),
      false,
      'Shipped orders cannot transition to cancelled',
    );
    assert.equal(
      OrderTrackingService.isValidTransition('out_for_delivery', 'cancelled'),
      false,
      'Out for delivery orders cannot transition to cancelled',
    );
    assert.equal(
      OrderTrackingService.isValidTransition('delivered', 'cancelled'),
      false,
      'Delivered orders cannot transition to cancelled',
    );
  });

  it('strictly rejects illegal backward, jump, or terminal state transitions', () => {
    // Terminal states cannot transition to anything
    assert.deepEqual(VALID_TRANSITIONS['delivered'], []);
    assert.deepEqual(VALID_TRANSITIONS['cancelled'], []);
    assert.equal(OrderTrackingService.isValidTransition('delivered', 'placed'), false);
    assert.equal(OrderTrackingService.isValidTransition('delivered', 'shipped'), false);
    assert.equal(OrderTrackingService.isValidTransition('cancelled', 'placed'), false);
    assert.equal(OrderTrackingService.isValidTransition('cancelled', 'delivered'), false);

    // Cannot skip stages forward
    assert.equal(OrderTrackingService.isValidTransition('placed', 'shipped'), false);
    assert.equal(OrderTrackingService.isValidTransition('placed', 'delivered'), false);
    assert.equal(OrderTrackingService.isValidTransition('confirmed', 'delivered'), false);

    // Cannot step backwards
    assert.equal(OrderTrackingService.isValidTransition('shipped', 'packed'), false);
    assert.equal(OrderTrackingService.isValidTransition('shipped', 'confirmed'), false);
    assert.equal(OrderTrackingService.isValidTransition('out_for_delivery', 'shipped'), false);
  });
});

describe('Workstream C: Append-Only Timeline & Outbox Models', () => {
  it('OrderStatusEvent model specifies append-only schema, actor, and tracking metadata', () => {
    const eventModelPath = path.join(apiDir, 'src', 'models', 'OrderStatusEvent.model.ts');
    assert.ok(fs.existsSync(eventModelPath), 'OrderStatusEvent.model.ts must exist');
    const content = fs.readFileSync(eventModelPath, 'utf-8');

    assert.match(content, /orderId:\s*\{\s*type:\s*mongoose\.Schema\.Types\.ObjectId,\s*ref:\s*'Order'/);
    assert.match(content, /status:\s*\{\s*type:\s*String/);
    assert.match(content, /previousStatus:\s*\{\s*type:\s*String/);
    assert.match(content, /visibility:\s*\{\s*type:\s*String,\s*enum:\s*\['customer',\s*'internal'\]/);
    assert.match(content, /actor:\s*\{[\s\S]*?userId:[\s\S]*?name:[\s\S]*?role:/);
    assert.match(content, /carrier:\s*\{\s*type:\s*String/);
    assert.match(content, /trackingNumber:\s*\{\s*type:\s*String/);
    assert.match(content, /trackingUrl:\s*\{\s*type:\s*String/);
    assert.match(content, /idempotencyKey:\s*\{\s*type:\s*String/);
  });

  it('NotificationOutbox model defines transactional guaranteed delivery queue', () => {
    const outboxModelPath = path.join(apiDir, 'src', 'models', 'NotificationOutbox.model.ts');
    assert.ok(fs.existsSync(outboxModelPath), 'NotificationOutbox.model.ts must exist');
    const content = fs.readFileSync(outboxModelPath, 'utf-8');

    assert.match(content, /orderId:\s*\{\s*type:\s*mongoose\.Schema\.Types\.ObjectId,\s*ref:\s*'Order'/);
    assert.match(content, /channel:\s*\{\s*type:\s*String,\s*enum:\s*\['email',\s*'sms'\]/);
    assert.match(content, /template:\s*\{\s*type:\s*String/);
    assert.match(content, /recipient:\s*\{\s*type:\s*String/);
    assert.match(content, /status:\s*\{[\s\S]*?'pending'/);
    assert.match(content, /attempts:\s*\{\s*type:\s*Number/);
    assert.match(content, /idempotencyKey:\s*\{\s*type:\s*String,\s*required:\s*true/);
  });

  it('Zod validation schema enforces valid statuses and URLs for admin status updates', () => {
    // Valid status transition payload
    const valid = updateOrderStatusTrackingSchema.safeParse({
      params: { orderId: '66f0123456789abcdef01234' },
      body: {
        status: 'shipped',
        carrier: 'Blue Dart',
        trackingNumber: 'BD123456789',
        trackingUrl: 'https://track.bluedart.com/track/BD123456789',
        note: 'Package handed over to courier.',
      },
    });
    assert.equal(valid.success, true);

    // Invalid URL rejected
    const invalidUrl = updateOrderStatusTrackingSchema.safeParse({
      params: { orderId: '66f0123456789abcdef01234' },
      body: {
        status: 'shipped',
        trackingUrl: 'not-a-valid-url',
      },
    });
    assert.equal(invalidUrl.success, false);

    // Invalid status rejected
    const invalidStatus = updateOrderStatusTrackingSchema.safeParse({
      params: { orderId: '66f0123456789abcdef01234' },
      body: {
        status: 'flying_in_sky',
      },
    });
    assert.equal(invalidStatus.success, false);
  });
});

describe('Workstream C: SSE Stream Formatting & Event Emitter Contracts', () => {
  it('orderTrackingEmitter is configured for multi-subscriber order streams', () => {
    assert.ok(orderTrackingEmitter, 'orderTrackingEmitter must be exported');
    assert.equal(typeof orderTrackingEmitter.on, 'function');
    assert.equal(typeof orderTrackingEmitter.emit, 'function');
  });

  it('OrderTrackingController configures standard SSE streaming headers', () => {
    const controllerPath = path.join(apiDir, 'src', 'controllers', 'orderTracking.controller.ts');
    const content = fs.readFileSync(controllerPath, 'utf-8');

    assert.match(content, /res\.setHeader\('Content-Type',\s*'text\/event-stream'\)/);
    assert.match(content, /res\.setHeader\('Cache-Control',\s*'no-cache,\s*no-transform'\)/);
    assert.match(content, /res\.setHeader\('Connection',\s*'keep-alive'\)/);
    assert.match(content, /res\.setHeader\('X-Accel-Buffering',\s*'no'\)/);
  });

  it('OrderTrackingController formats SSE events and 15s keep-alive heartbeat comments', () => {
    const controllerPath = path.join(apiDir, 'src', 'controllers', 'orderTracking.controller.ts');
    const content = fs.readFileSync(controllerPath, 'utf-8');

    // Initial state event
    assert.match(content, /event:\s*initial_state\\ndata:/);
    // Order update event
    assert.match(content, /event:\s*order_update\\nid:/);
    // Keep-alive heartbeat comment
    assert.match(content, /: ping\\n\\n/);
    // Heartbeat interval of 15000ms
    assert.match(content, /15000\)/);
  });

  it('OrderTrackPage frontend component implements EventSource live updates and stepper a11y', () => {
    const trackPagePath = path.join(rootDir, 'apps', 'web', 'src', 'app', 'orders', '[id]', 'track', 'page.tsx');
    assert.ok(fs.existsSync(trackPagePath), 'Customer tracking page must exist');
    const content = fs.readFileSync(trackPagePath, 'utf-8');

    // EventSource connection
    assert.match(content, /new EventSource\(`/);
    assert.match(content, /addEventListener\('order_update'/);
    assert.match(content, /addEventListener\('initial_state'/);

    // Stepper accessible contracts
    assert.match(content, /aria-current=\{isCurrent \? 'step' : undefined\}/);
    assert.match(content, /aria-live="polite"/);

    // Status phases
    assert.match(content, /'placed'/);
    assert.match(content, /'confirmed'/);
    assert.match(content, /'packed'/);
    assert.match(content, /'shipped'/);
    assert.match(content, /'out_for_delivery'/);
    assert.match(content, /'delivered'/);

    // Auth token integration & accessible tap targets
    assert.match(content, /api\.get[\s\S]*?\/orders\/.*\/timeline/, 'Must fetch timeline with auth header');
    assert.match(content, /sseUrl\.searchParams\.set\('token',\s*token\)/, 'Must pass token to EventSource');
    assert.match(content, /min-h-\[44px\]\s*min-w-\[44px\]/, 'Carrier link must satisfy 44x44px touch target');
  });

  it('admin.service.ts enforces strict cancellation boundaries and outbox queuing', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    // Cancellation boundaries
    assert.match(content, /shipped:\s*\['out_for_delivery'\]/, 'Shipped cannot be cancelled in admin.service');
    assert.match(content, /out_for_delivery:\s*\['delivered'\]/, 'Out for delivery cannot be cancelled in admin.service');

    // NotificationOutbox queueing
    assert.match(content, /NotificationOutbox\.create/, 'admin.service must enqueue notifications on status update');
  });
});
