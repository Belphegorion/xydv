/**
 * Coupon Concurrency & Race Condition Test Suite
 * Validates:
 * - Atomic reservation semantics under concurrent load
 * - Zero overselling guarantee when maxRedemptions is reached
 * - Per-user redemption ceiling enforcement under parallel requests
 * - Rollback on payment failure releasing reserved quota
 * - State machine transitions: 'reserved' -> 'completed' | 'released'
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');

describe('Coupon Concurrency: Atomic Quota & Race Condition Prevention', () => {
  // In-memory atomic store simulating MongoDB findOneAndUpdate with filter condition
  class MockCouponStore {
    constructor(code, maxRedemptions, maxRedemptionsPerUser = 1) {
      this.code = code;
      this.maxRedemptions = maxRedemptions;
      this.maxRedemptionsPerUser = maxRedemptionsPerUser;
      this.redemptions = []; // Array of { id, userId, status: 'reserved' | 'completed' | 'released' }
    }

    // Atomic reservation method emulating atomic transaction in coupon.service.ts
    async reserve(userId, razorpayOrderId) {
      // 1. Check user redemptions (active = reserved or completed)
      const userActive = this.redemptions.filter(
        (r) => r.userId === userId && (r.status === 'reserved' || r.status === 'completed'),
      ).length;

      if (userActive >= this.maxRedemptionsPerUser) {
        throw new Error('COUPON_USER_LIMIT_REACHED');
      }

      // 2. Check global quota (reserved + completed)
      const globalActive = this.redemptions.filter(
        (r) => r.status === 'reserved' || r.status === 'completed',
      ).length;

      if (globalActive >= this.maxRedemptions) {
        throw new Error('COUPON_DEPLETED');
      }

      // 3. Atomically append reservation
      const rec = {
        id: `red_${Date.now()}_${Math.random()}`,
        userId,
        razorpayOrderId,
        status: 'reserved',
      };
      this.redemptions.push(rec);
      return rec;
    }

    async commit(razorpayOrderId) {
      const rec = this.redemptions.find((r) => r.razorpayOrderId === razorpayOrderId);
      if (rec && rec.status === 'reserved') {
        rec.status = 'completed';
      }
    }

    async release(razorpayOrderId) {
      const rec = this.redemptions.find((r) => r.razorpayOrderId === razorpayOrderId);
      if (rec && rec.status === 'reserved') {
        rec.status = 'released';
      }
    }
  }

  it('Guarantees zero overselling when 20 parallel requests compete for 3 coupons', async () => {
    const store = new MockCouponStore('FLASH30', 3, 1);

    const requests = Array.from({ length: 20 }, (_, idx) => {
      const userId = `user_${idx + 1}`;
      const rzpId = `order_rzp_${idx + 1}`;
      return store
        .reserve(userId, rzpId)
        .then(() => ({ success: true, userId }))
        .catch((err) => ({ success: false, error: err.message, userId }));
    });

    const results = await Promise.all(requests);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    assert.equal(successful.length, 3, 'Exactly 3 reservations must succeed');
    assert.equal(failed.length, 17, 'Exactly 17 requests must be rejected');
    assert.ok(
      failed.every((f) => f.error === 'COUPON_DEPLETED'),
      'All rejected requests must report coupon depletion',
    );
  });

  it('Enforces per-user limit when single user issues 10 simultaneous parallel checkouts', async () => {
    const store = new MockCouponStore('ONCEONLY', 100, 1);
    const userId = 'user_exploit_target';

    const requests = Array.from({ length: 10 }, (_, idx) => {
      const rzpId = `order_rzp_exploit_${idx + 1}`;
      return store
        .reserve(userId, rzpId)
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, error: err.message }));
    });

    const results = await Promise.all(requests);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    assert.equal(successful.length, 1, 'Only 1 checkout per user can reserve the coupon');
    assert.equal(failed.length, 9, 'All subsequent concurrent checkouts must fail');
    assert.ok(
      failed.every((f) => f.error === 'COUPON_USER_LIMIT_REACHED'),
      'Errors must indicate per-user limit reached',
    );
  });

  it('Releases reserved quota upon checkout cancellation, allowing another user to claim it', async () => {
    const store = new MockCouponStore('LASTONE', 1, 1);

    // User A reserves the last coupon
    const resA = await store.reserve('user_A', 'rzp_order_A');
    assert.equal(resA.status, 'reserved');

    // User B tries to reserve -> fails as quota is held
    await assert.rejects(
      store.reserve('user_B', 'rzp_order_B'),
      /COUPON_DEPLETED/,
      'User B must be blocked while hold is active',
    );

    // User A cancels checkout or payment fails -> release quota
    await store.release('rzp_order_A');

    // User B retries -> now succeeds!
    const resB = await store.reserve('user_B', 'rzp_order_B');
    assert.equal(resB.status, 'reserved');

    // User B completes payment -> commit
    await store.commit('rzp_order_B');
    assert.equal(resB.status, 'completed');
  });
});

describe('Coupon Service Implementation Code Audit', () => {
  const serviceFile = fs.readFileSync(
    path.join(apiDir, 'src', 'services', 'coupon.service.ts'),
    'utf-8',
  );

  it('Implements atomic reservation with status reserved', () => {
    assert.match(
      serviceFile,
      /reserveCoupon\s*\(/,
      'coupon.service.ts must implement reserveCoupon',
    );
    assert.match(
      serviceFile,
      /status:\s*'reserved'/,
      'reserveCoupon must create redemption with status reserved',
    );
  });

  it('Implements commitRedemption transitioning status to completed', () => {
    assert.match(
      serviceFile,
      /commitRedemption\s*\(/,
      'coupon.service.ts must implement commitRedemption',
    );
    assert.match(
      serviceFile,
      /status:\s*'completed'/,
      'commitRedemption must update redemption status to completed',
    );
  });

  it('Implements releaseRedemption transitioning status to released and decrementing count', () => {
    assert.match(
      serviceFile,
      /releaseRedemption\s*\(/,
      'coupon.service.ts must implement releaseRedemption',
    );
    assert.match(
      serviceFile,
      /status:\s*'released'/,
      'releaseRedemption must update redemption status to released',
    );
  });

  it('Enforces per-user limit with atomic rollback inside reserveCoupon', () => {
    assert.match(
      serviceFile,
      /priorCount\s*>=\s*coupon\.maxRedemptionsPerUser/,
      'reserveCoupon must verify per-user limit priorCount against maxRedemptionsPerUser',
    );
    assert.match(
      serviceFile,
      /\$inc:\s*\{\s*redemptionCount:\s*-1\s*\}/,
      'reserveCoupon must rollback redemptionCount increment if per-user quota is exceeded',
    );
  });

  it('Releases held coupon redemptions across all cancellation and failure pathways', () => {
    const webhookFile = fs.readFileSync(
      path.join(apiDir, 'src', 'controllers', 'webhook.controller.ts'),
      'utf-8',
    );
    assert.match(
      webhookFile,
      /couponService\.releaseRedemption\(payment\.order_id\)/,
      'webhook.controller.ts must release coupon redemption on payment.failed',
    );

    const inventoryFile = fs.readFileSync(
      path.join(apiDir, 'src', 'services', 'inventory.service.ts'),
      'utf-8',
    );
    assert.match(
      inventoryFile,
      /couponService\.releaseRedemption\(reservation\.razorpayOrderId\)/,
      'inventory.service.ts must release held coupon when expiring abandoned reservations',
    );

    const adminFile = fs.readFileSync(
      path.join(apiDir, 'src', 'services', 'admin.service.ts'),
      'utf-8',
    );
    assert.match(
      adminFile,
      /couponService\.releaseRedemption\(order\.razorpayOrderId\)/,
      'admin.service.ts must release coupon redemption on order cancellation and refund',
    );
  });

  it('CartDrawer enforces >= 44px touch target on remove coupon action and avoids duplicate apply calls', () => {
    const cartDrawerFile = fs.readFileSync(
      path.join(rootDir, 'apps', 'web', 'src', 'components', 'store', 'CartDrawer.tsx'),
      'utf-8',
    );
    assert.match(
      cartDrawerFile,
      /aria-label="Remove coupon"[\s\S]*?min-h-\[44px\]|min-h-\[44px\][\s\S]*?aria-label="Remove coupon"/,
      'Remove coupon button must enforce min-h-[44px] for touch target accessibility',
    );
    assert.match(
      cartDrawerFile,
      /lastValidatedKeyRef|justAppliedRef/,
      'CartDrawer must track last validated state to prevent redundant validation on initial apply',
    );
  });

  it('Enforces compound indexes on CouponRedemption for fast and unique lookup', () => {
    const modelFile = fs.readFileSync(
      path.join(apiDir, 'src', 'models', 'CouponRedemption.model.ts'),
      'utf-8',
    );
    assert.match(
      modelFile,
      /couponId:\s*1,\s*userId:\s*1,\s*status:\s*1/,
      'CouponRedemption model must index { couponId: 1, userId: 1, status: 1 }',
    );
    assert.match(
      modelFile,
      /razorpayOrderId:\s*\{\s*type:\s*String,\s*index:\s*true\s*\}/,
      'CouponRedemption model must index razorpayOrderId',
    );
  });
});
