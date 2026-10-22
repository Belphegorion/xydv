/**
 * Batch 2 Verification Test Suite: Money, Payments & Gateway Integrity
 * Findings Verified:
 * - CRIT-03: CartDrawer payment verification integrity, no fake simulated signature submission
 * - CRIT-04: Dynamic settings integration for order calculation, INR store defaults (₹15, 18% GST)
 * - HIGH-06: Address country schema alignment to India ('IN') in User and Order models
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const apiDir = path.join(rootDir, 'apps', 'api');
const typesDir = path.join(rootDir, 'packages', 'types');

describe('Batch 2: CRIT-03 - CartDrawer Gateway Integrity & Fake Signature Removal', () => {
  const cartDrawerSrc = fs.readFileSync(
    path.join(webDir, 'src', 'components', 'store', 'CartDrawer.tsx'),
    'utf-8',
  );

  it('Removes simulated_offline_signature and forged signature submission', () => {
    assert.doesNotMatch(
      cartDrawerSrc,
      /simulated_offline_signature/,
      'CartDrawer must not submit simulated_offline_signature to backend verification',
    );
  });

  it('Guards payment verification handler against missing cryptographic signatures', () => {
    assert.match(
      cartDrawerSrc,
      /!response\.razorpay_payment_id\s*\|\|\s*!response\.razorpay_signature/,
      'CartDrawer must guard against missing paymentId or signature before sending verification',
    );
  });

  it('Handles modal ondismiss cleanly without triggering forged verification', () => {
    assert.match(
      cartDrawerSrc,
      /ondismiss:\s*\(\)\s*=>\s*\{[\s\S]*?setIsProcessing\(false\);[\s\S]*?setPaymentError\(/,
      'CartDrawer must show a clean user notice when payment modal is dismissed',
    );
  });

  it('Listens to payment.failed event and updates payment error state', () => {
    assert.match(
      cartDrawerSrc,
      /rzp\.on\('payment\.failed'/,
      'CartDrawer must attach a payment.failed handler to the Razorpay instance',
    );
  });
});

describe('Batch 2: CRIT-04 - Dynamic Order Price Calculation & Store Settings Sync', () => {
  const orderServiceSrc = fs.readFileSync(
    path.join(apiDir, 'src', 'services', 'order.service.ts'),
    'utf-8',
  );
  const commerceConstantsSrc = fs.readFileSync(
    path.join(apiDir, 'src', 'constants', 'commerce.ts'),
    'utf-8',
  );
  const cartTypesSrc = fs.readFileSync(
    path.join(typesDir, 'src', 'cart.ts'),
    'utf-8',
  );
  const cartDrawerSrc = fs.readFileSync(
    path.join(webDir, 'src', 'components', 'store', 'CartDrawer.tsx'),
    'utf-8',
  );
  const settingsRoutesSrc = fs.readFileSync(
    path.join(apiDir, 'src', 'routes', 'settings.routes.ts'),
    'utf-8',
  );

  it('OrderService implements calculateOrderTotals querying live settings', () => {
    assert.match(
      orderServiceSrc,
      /calculateOrderTotals\(/,
      'OrderService must export/implement calculateOrderTotals method',
    );
    assert.match(
      orderServiceSrc,
      /getLiveStoreSettings\(/,
      'OrderService must implement getLiveStoreSettings to query Setting collection',
    );
  });

  it('Commerce constants use INR store baseline defaults: shipping ₹15, tax 18% GST', () => {
    assert.match(
      commerceConstantsSrc,
      /STANDARD_SHIPPING_FEE:\s*15(\.0)?/,
      'STANDARD_SHIPPING_FEE in commerce constants must be 15 (₹15)',
    );
    assert.match(
      commerceConstantsSrc,
      /TAX_RATE:\s*0\.18/,
      'TAX_RATE in commerce constants must be 0.18 (18% GST)',
    );
  });

  it('Packages/types COMMERCE_RULES supports customRules and aligns with INR baseline', () => {
    assert.match(
      cartTypesSrc,
      /standardShippingFee:\s*15(\.0)?/,
      'COMMERCE_RULES.standardShippingFee must be 15 in packages/types',
    );
    assert.match(
      cartTypesSrc,
      /taxRate:\s*0\.18/,
      'COMMERCE_RULES.taxRate must be 0.18 in packages/types',
    );
    assert.match(
      cartTypesSrc,
      /customRules\?:/i,
      'calculateCartMetrics must accept customRules parameter',
    );
  });

  it('Public /api/settings route exists and serves live settings with fallback defaults', () => {
    assert.match(
      settingsRoutesSrc,
      /router\.get\('\/'/,
      'settings.routes.ts must expose GET / route',
    );
    assert.match(
      settingsRoutesSrc,
      /Setting\.findOne\(\{\s*key:\s*'global_store_settings'\s*\}\)/,
      'settings route must query global_store_settings',
    );
  });

  it('CartDrawer fetches live /api/settings and renders dynamic tax percentage label', () => {
    assert.match(
      cartDrawerSrc,
      /api\.get[\s\S]*?\/settings/,
      'CartDrawer must query /settings on mount',
    );
    assert.match(
      cartDrawerSrc,
      /ESTIMATED TAX \(\{Math\.round\(storeSettings\.taxRate \* 100\)\}%\)/,
      'CartDrawer must display dynamic tax percentage matching live storeSettings',
    );
  });
});

describe('Batch 2: HIGH-06 - Address Country Default Schema Alignment', () => {
  it('User.model.ts sets address country default to IN', () => {
    const userModelSrc = fs.readFileSync(
      path.join(apiDir, 'src', 'models', 'User.model.ts'),
      'utf-8',
    );
    assert.match(
      userModelSrc,
      /country:\s*\{\s*type:\s*String,\s*required:\s*true,\s*default:\s*'IN'\s*\}/,
      'User model address schema must default country to IN',
    );
    assert.doesNotMatch(
      userModelSrc,
      /country:\s*\{\s*type:\s*String,\s*required:\s*true,\s*default:\s*'US'\s*\}/,
      'User model address schema must not default country to US',
    );
  });

  it('Order.model.ts sets shipping address country default to IN', () => {
    const orderModelSrc = fs.readFileSync(
      path.join(apiDir, 'src', 'models', 'Order.model.ts'),
      'utf-8',
    );
    assert.match(
      orderModelSrc,
      /country:\s*\{\s*type:\s*String,\s*required:\s*true,\s*default:\s*'IN'\s*\}/,
      'Order model shipping address schema must default country to IN',
    );
  });
});
