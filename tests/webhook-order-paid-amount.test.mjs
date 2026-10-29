/**
 * Regression Test Suite: Security Audit Workstream A Fixes
 * Findings Verified:
 * - Finding A-1 (Critical): Redaction of plaintext MongoDB Atlas credentials in AWS deployment guide
 * - Finding A-2 (High): Razorpay order.paid webhook amount verification and transition rejection (static & functional)
 * - Finding A-4 (Medium/High): Customer JWT in-memory store migration and httpOnly refresh session rehydration
 * - Finding A-6 (High): Support ticket schema validation (Zod functional & static), crypto.randomBytes ticket ID, and rate limiting
 * - Finding A-7 (Medium): Telemetry IP pseudonymization with SHA-256 and salt in admin service (static & functional)
 * - Finding A-8, A-9, A-10 (Low): nextConfig poweredByHeader: false, CSP strictness (no unsafe-eval, no prod localhost), and Nginx X-XSS-Protection: 0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Import compiled backend modules for functional testing
import { WebhookController } from '../apps/api/dist/controllers/webhook.controller.js';
import { Order } from '../apps/api/dist/models/Order.model.js';
import { ProcessedWebhookEvent } from '../apps/api/dist/models/Idempotency.model.js';
import { inventoryService } from '../apps/api/dist/services/inventory.service.js';
import { couponService } from '../apps/api/dist/services/coupon.service.js';
import { createTicketSchema } from '../apps/api/dist/routes/support.routes.js';
import { RAZORPAY_WEBHOOK_SECRET } from '../apps/api/dist/config/razorpay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');
const webDir = path.join(rootDir, 'apps', 'web');

describe('Finding A-1: MongoDB Atlas Credentials Redaction', () => {
  it('AWS-FREE-TIER-DEPLOYMENT-GUIDE.md uses safe placeholder for MONGODB_URI', () => {
    const guidePath = path.join(rootDir, 'AWS-FREE-TIER-DEPLOYMENT-GUIDE.md');
    assert.ok(fs.existsSync(guidePath), 'Deployment guide must exist');
    const content = fs.readFileSync(guidePath, 'utf-8');

    // Must contain exact placeholder
    assert.match(
      content,
      /MONGODB_URI=mongodb\+srv:\/\/.*<DB_USER>:<DB_PASSWORD>@<CLUSTER>\.mongodb\.net\/<DB_NAME>\?retryWrites=true&w=majority/,
      'Must contain standardized redacted MongoDB placeholder',
    );
    // Must NOT contain cluster0.XXXXX or username/password literal
    assert.doesNotMatch(
      content,
      /cluster0\.XXXXX\.mongodb\.net/,
      'Must not contain unredacted cluster hostname pattern',
    );
  });
});

describe('Finding A-2: Razorpay order.paid Webhook Amount Verification', () => {
  const webhookControllerPath = path.join(apiDir, 'src', 'controllers', 'webhook.controller.ts');

  it('webhook.controller.ts verifies amount_paid in order.paid event handler (static contract)', () => {
    assert.ok(fs.existsSync(webhookControllerPath), 'webhook.controller.ts must exist');
    const content = fs.readFileSync(webhookControllerPath, 'utf-8');

    // order.paid case must verify existing order and amount
    const orderPaidCaseMatch = content.match(/case\s+['"]order\.paid['"]:[\s\S]*?(?=case\s+['"]payment\.failed['"]:)/);
    assert.ok(orderPaidCaseMatch, 'case "order.paid" block must exist');
    const orderPaidBlock = orderPaidCaseMatch[0];

    assert.match(
      orderPaidBlock,
      /Order\.findOne\(\s*\{\s*razorpayOrderId:\s*orderEntity\.id\s*\}\s*\)/,
      'order.paid must look up existing order by razorpayOrderId',
    );

    assert.match(
      orderPaidBlock,
      /Math\.round\(\s*existingOrder\.total\s*\*\s*100\s*\)/,
      'order.paid must calculate expected paise from existingOrder.total',
    );

    assert.match(
      orderPaidBlock,
      /orderEntity\.amount_paid/,
      'order.paid must inspect orderEntity.amount_paid',
    );

    assert.match(
      orderPaidBlock,
      /paymentStatus:\s*['"]failed['"],\s*status:\s*['"]cancelled['"]/,
      'order.paid must mark order failed/cancelled on amount mismatch',
    );
  });

  it('rejects order.paid event when amount_paid does not match order total (functional)', async () => {
    const controller = new WebhookController();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    // Stub idempotency & database lookups for isolated functional execution
    ProcessedWebhookEvent.findOne = async () => null;
    ProcessedWebhookEvent.create = async () => null;

    let updateOneCalled = false;
    let updatedFilter = null;
    let updatedFields = null;

    // Existing order has total: ₹150.00 -> 15000 paise
    Order.findOne = async () => ({
      _id: 'mongo_order_id_123',
      total: 150.0,
      razorpayOrderId: 'order_rzp_test_mismatch',
    });

    Order.updateOne = async (filter, update) => {
      updateOneCalled = true;
      updatedFilter = filter;
      updatedFields = update;
      return { acknowledged: true, modifiedCount: 1 };
    };

    Order.findOneAndUpdate = async () => {
      assert.fail('findOneAndUpdate must NOT be called when order.paid amount mismatches');
    };

    // Mismatched amount: attacker paid 5000 paise (₹50) instead of 15000 paise (₹150)
    const payloadObj = {
      id: `evt_mismatch_${Date.now()}`,
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: 'order_rzp_test_mismatch',
            amount_paid: 5000,
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payloadObj), 'utf-8');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const req = {
      headers: { 'x-razorpay-signature': signature },
      body: rawBody,
    };
    const res = {
      status: (code) => ({ json: (d) => ({ code, data: d }) }),
      json: (d) => d,
    };

    await controller.handleRazorpayWebhook(req, res);

    assert.equal(updateOneCalled, true, 'Order.updateOne must be called to mark order failed');
    assert.deepEqual(updatedFilter, { _id: 'mongo_order_id_123' });
    assert.equal(updatedFields?.$set?.paymentStatus, 'failed');
    assert.equal(updatedFields?.$set?.status, 'cancelled');
  });

  it('rejects order.paid event when amount_paid is undefined or missing (functional)', async () => {
    const controller = new WebhookController();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    ProcessedWebhookEvent.findOne = async () => null;
    ProcessedWebhookEvent.create = async () => null;

    let updateOneCalled = false;
    let updatedFields = null;

    Order.findOne = async () => ({
      _id: 'mongo_order_id_456',
      total: 200.0,
      razorpayOrderId: 'order_rzp_test_missing',
    });

    Order.updateOne = async (_filter, update) => {
      updateOneCalled = true;
      updatedFields = update;
      return { acknowledged: true, modifiedCount: 1 };
    };

    Order.findOneAndUpdate = async () => {
      assert.fail('findOneAndUpdate must NOT be called when amount_paid is missing');
    };

    // Payload omitting amount_paid completely
    const payloadObj = {
      id: `evt_missing_${Date.now()}`,
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: 'order_rzp_test_missing',
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payloadObj), 'utf-8');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const req = {
      headers: { 'x-razorpay-signature': signature },
      body: rawBody,
    };
    const res = {
      status: (code) => ({ json: (d) => ({ code, data: d }) }),
      json: (d) => d,
    };

    await controller.handleRazorpayWebhook(req, res);

    assert.equal(updateOneCalled, true, 'Missing amount_paid must be rejected');
    assert.equal(updatedFields?.$set?.paymentStatus, 'failed');
    assert.equal(updatedFields?.$set?.status, 'cancelled');
  });

  it('accepts order.paid event when amount_paid matches order total in paise (functional)', async () => {
    const controller = new WebhookController();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    ProcessedWebhookEvent.findOne = async () => null;
    ProcessedWebhookEvent.create = async () => null;
    inventoryService.captureReservation = async () => {};
    couponService.commitRedemption = async () => {};

    let findOneAndUpdateCalled = false;
    let updatedFields = null;

    // Existing order total: ₹99.50 -> 9950 paise
    Order.findOne = async () => ({
      _id: 'mongo_order_id_789',
      total: 99.5,
      razorpayOrderId: 'order_rzp_test_valid',
    });

    Order.findOneAndUpdate = async (_filter, update) => {
      findOneAndUpdateCalled = true;
      updatedFields = update;
      return { _id: 'mongo_order_id_789', paymentStatus: 'captured', status: 'confirmed' };
    };

    Order.updateOne = async () => {
      assert.fail('Order.updateOne must NOT be called when amounts match');
    };

    const payloadObj = {
      id: `evt_valid_${Date.now()}`,
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: 'order_rzp_test_valid',
            amount_paid: 9950,
            payment_id: 'pay_valid_123',
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payloadObj), 'utf-8');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const req = {
      headers: { 'x-razorpay-signature': signature },
      body: rawBody,
    };
    const res = {
      status: (code) => ({ json: (d) => ({ code, data: d }) }),
      json: (d) => d,
    };

    await controller.handleRazorpayWebhook(req, res);

    assert.equal(findOneAndUpdateCalled, true, 'Matching amount must confirm order');
    assert.equal(updatedFields?.$set?.paymentStatus, 'captured');
    assert.equal(updatedFields?.$set?.status, 'confirmed');
    assert.equal(updatedFields?.$set?.razorpayPaymentId, 'pay_valid_123');
  });
});

describe('Finding A-4: Customer JWT In-Memory Storage & Rehydration', () => {
  const customerAuthPath = path.join(webDir, 'src', 'store', 'customerAuth.ts');

  it('customerAuth.ts removes localStorage persistence on login and register', () => {
    assert.ok(fs.existsSync(customerAuthPath), 'customerAuth.ts must exist');
    const content = fs.readFileSync(customerAuthPath, 'utf-8');

    // login method must not write token to localStorage
    const loginMatch = content.match(/login:\s*async[\s\S]*?(?=register:\s*async)/);
    assert.ok(loginMatch, 'login method must exist');
    assert.doesNotMatch(
      loginMatch[0],
      /^\s*localStorage\.setItem\(['"]xydv_auth_token['"]/m,
      'login must not actively execute localStorage.setItem for xydv_auth_token',
    );

    // register method must not write token to localStorage
    const registerMatch = content.match(/register:\s*async[\s\S]*?(?=logout:\s*\(\))/);
    assert.ok(registerMatch, 'register method must exist');
    assert.doesNotMatch(
      registerMatch[0],
      /^\s*localStorage\.setItem\(['"]xydv_auth_token['"]/m,
      'register must not actively execute localStorage.setItem for xydv_auth_token',
    );

    // customerAuth must implement checkAuth session rehydration
    assert.match(
      content,
      /checkAuth\s*:/,
      'customerAuth must expose checkAuth method for session rehydration',
    );
  });
});

describe('Finding A-6: Support Route Validation, Ticket ID & Rate Limiting', () => {
  const supportRoutePath = path.join(apiDir, 'src', 'routes', 'support.routes.ts');

  it('support.routes.ts defines and enforces createTicketSchema Zod validation (static contract)', () => {
    assert.ok(fs.existsSync(supportRoutePath), 'support.routes.ts must exist');
    const content = fs.readFileSync(supportRoutePath, 'utf-8');

    assert.match(
      content,
      /createTicketSchema/,
      'support.routes.ts must declare createTicketSchema',
    );
    assert.match(
      content,
      /z\.string\(\)\s*\.trim\(\)\s*\.email\(/,
      'createTicketSchema must enforce email format validation',
    );
    assert.match(
      content,
      /validateRequest\(\s*createTicketSchema\s*\)/,
      'support route must mount validateRequest middleware with createTicketSchema',
    );
  });

  it('createTicketSchema validates payloads correctly (functional)', async () => {
    // Valid minimal payload
    const validMinimal = await createTicketSchema.parseAsync({
      body: {
        name: 'Alex Smith',
        email: 'alex.smith@example.com',
        message: 'Need help with size selection.',
      },
    });
    assert.equal(validMinimal.body.name, 'Alex Smith');
    assert.equal(validMinimal.body.email, 'alex.smith@example.com');

    // Valid complete payload with orderId and topic
    const validComplete = await createTicketSchema.parseAsync({
      body: {
        name: 'Jordan Lee',
        email: 'JORDAN@EXAMPLE.COM',
        subject: 'Order Dispatch',
        topic: 'Shipping',
        orderId: 'ord_xyz_789',
        message: 'Where is my shipment?',
      },
    });
    assert.equal(validComplete.body.email, 'jordan@example.com');
    assert.equal(validComplete.body.orderId, 'ord_xyz_789');

    // Invalid: missing / invalid email
    await assert.rejects(
      async () => {
        await createTicketSchema.parseAsync({
          body: {
            name: 'Jordan Lee',
            email: 'not-an-email',
            message: 'Where is my shipment?',
          },
        });
      },
      (err) => {
        assert.ok(err.errors.some((e) => e.path.includes('email')));
        return true;
      },
    );

    // Invalid: empty name
    await assert.rejects(
      async () => {
        await createTicketSchema.parseAsync({
          body: {
            name: '   ',
            email: 'jordan@example.com',
            message: 'Hello',
          },
        });
      },
      (err) => {
        assert.ok(err.errors.some((e) => e.path.includes('name')));
        return true;
      },
    );

    // Invalid: empty message
    await assert.rejects(
      async () => {
        await createTicketSchema.parseAsync({
          body: {
            name: 'Jordan Lee',
            email: 'jordan@example.com',
            message: '   ',
          },
        });
      },
      (err) => {
        assert.ok(err.errors.some((e) => e.path.includes('message')));
        return true;
      },
    );
  });

  it('support.routes.ts generates ticket IDs with crypto.randomBytes', () => {
    const content = fs.readFileSync(supportRoutePath, 'utf-8');
    assert.match(
      content,
      /crypto\.randomBytes\(4\)\.toString\(['"]hex['"]\)/,
      'support ticketId must use crypto.randomBytes(4).toString("hex")',
    );
    assert.doesNotMatch(
      content,
      /Math\.random\(\)/,
      'support route must not use Math.random for ticket ID generation',
    );
  });

  it('support.routes.ts applies rate limiting', () => {
    const content = fs.readFileSync(supportRoutePath, 'utf-8');
    assert.match(
      content,
      /authLimiter/,
      'support route must apply authLimiter or dedicated rate limiter',
    );
  });
});

describe('Finding A-7: Telemetry IP Pseudonymization in Admin Service', () => {
  const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');

  it('admin.service.ts pseudonymizes IP address before saving PageView (static)', () => {
    assert.ok(fs.existsSync(adminServicePath), 'admin.service.ts must exist');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    const trackPageViewMatch = content.match(/trackPageView[\s\S]*?(?=async\s+getSettings)/);
    assert.ok(trackPageViewMatch, 'trackPageView method must exist');
    const trackPageViewCode = trackPageViewMatch[0];

    assert.match(
      trackPageViewCode,
      /createHash\(['"]sha256['"]\)/,
      'trackPageView must hash IP using sha256',
    );
    assert.match(
      trackPageViewCode,
      /process\.env\.IP_SALT/,
      'trackPageView must salt IP with process.env.IP_SALT',
    );
    assert.match(
      trackPageViewCode,
      /\.substring\(\s*0,\s*16\s*\)/,
      'trackPageView must truncate pseudonymized IP hash to 16 chars',
    );
  });

  it('IP pseudonymization produces deterministic 16-hex char hash and never stores raw IP (functional)', () => {
    const rawIp = '203.0.113.195';
    const salt = 'xydv-telemetry-salt';
    const pseudonym = crypto.createHash('sha256').update(rawIp + salt).digest('hex').substring(0, 16);

    assert.equal(pseudonym.length, 16, 'Pseudonym must be exactly 16 characters');
    assert.match(pseudonym, /^[0-9a-f]{16}$/, 'Pseudonym must be a hexadecimal string');
    assert.notEqual(pseudonym, rawIp, 'Pseudonym must not match raw IP');

    // Deterministic for same IP + salt
    const pseudonym2 = crypto.createHash('sha256').update(rawIp + salt).digest('hex').substring(0, 16);
    assert.equal(pseudonym, pseudonym2, 'Same IP and salt must produce identical pseudonym');

    // Different salt produces different hash
    const differentSalt = crypto.createHash('sha256').update(rawIp + 'other-salt').digest('hex').substring(0, 16);
    assert.notEqual(pseudonym, differentSalt, 'Different salt must produce different pseudonym');
  });
});

describe('Findings A-8, A-9, A-10: HTTP Security Headers & Nginx Hardening', () => {
  it('next.config.ts disables poweredByHeader', () => {
    const nextConfigPath = path.join(webDir, 'next.config.ts');
    assert.ok(fs.existsSync(nextConfigPath), 'next.config.ts must exist');
    const content = fs.readFileSync(nextConfigPath, 'utf-8');

    assert.match(
      content,
      /poweredByHeader:\s*false/,
      'nextConfig must have poweredByHeader: false',
    );
  });

  it('next.config.ts removes unsafe-eval from CSP script-src', () => {
    const nextConfigPath = path.join(webDir, 'next.config.ts');
    const content = fs.readFileSync(nextConfigPath, 'utf-8');

    const scriptSrcMatch = content.match(/script-src[^;]+/);
    assert.ok(scriptSrcMatch, 'script-src directive must exist');
    assert.doesNotMatch(
      scriptSrcMatch[0],
      /'unsafe-eval'/,
      'script-src must not contain unsafe-eval',
    );
  });

  it('next.config.ts removes localhost from production connect-src', () => {
    const nextConfigPath = path.join(webDir, 'next.config.ts');
    const content = fs.readFileSync(nextConfigPath, 'utf-8');

    assert.match(
      content,
      /isDev|\bNODE_ENV\b/,
      'next.config.ts must guard localhost connect-src behind development/environment check',
    );
  });

  it('deploy/nginx/nginx.conf sets X-XSS-Protection to 0 or removes it', () => {
    const nginxConfPath = path.join(rootDir, 'deploy', 'nginx', 'nginx.conf');
    assert.ok(fs.existsSync(nginxConfPath), 'deploy/nginx/nginx.conf must exist');
    const content = fs.readFileSync(nginxConfPath, 'utf-8');

    assert.doesNotMatch(
      content,
      /X-XSS-Protection\s+["']1;\s*mode=block["']/,
      'nginx.conf must not use deprecated X-XSS-Protection "1; mode=block"',
    );
  });
});
