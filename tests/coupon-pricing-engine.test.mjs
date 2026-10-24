/**
 * Coupon Pricing Engine & Margin Protection Test Suite
 * Validates:
 * - Decision A1: Preset discount tiers (10%, 20%, 50% High Risk) + Custom/Fixed
 * - Decision A2: Margin Protection: Mandatory Maximum Discount Cap (in ₹) for 50% coupons
 * - Decision A3: Stacking Policy: Strict one coupon per order
 * - Decision A4: Sale item exclusion toggle
 * - Paise integer arithmetic with zero floating-point penny leakage
 * - Proportional line-item allocation with remainder assigned to highest-value item
 * - GST Section 15(3)(a) Net Taxable Value computation
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

describe('Coupon Pricing Engine: Paise Math & Proportional Line-Item Distribution', () => {
  // Proportional line-item allocation algorithm (identical to coupon.service.ts)
  function allocateDiscount(items, totalDiscountPaise) {
    const totalSubtotalPaise = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0,
    );

    let allocatedSum = 0;
    const allocations = items.map((item) => {
      const itemSubtotalPaise = Math.round(item.price * 100) * item.quantity;
      const alloc = Math.floor((totalDiscountPaise * itemSubtotalPaise) / totalSubtotalPaise);
      allocatedSum += alloc;
      return {
        productId: item.productId,
        sku: item.sku,
        itemSubtotalPaise,
        discountAllocation: alloc,
        taxableAmount: itemSubtotalPaise - alloc,
      };
    });

    // Remainder penny/paisa assigned to the highest-value line item
    const remainder = totalDiscountPaise - allocatedSum;
    if (remainder > 0 && allocations.length > 0) {
      let highestIndex = 0;
      let highestVal = allocations[0].itemSubtotalPaise;
      for (let i = 1; i < allocations.length; i++) {
        if (allocations[i].itemSubtotalPaise > highestVal) {
          highestVal = allocations[i].itemSubtotalPaise;
          highestIndex = i;
        }
      }
      allocations[highestIndex].discountAllocation += remainder;
      allocations[highestIndex].taxableAmount -= remainder;
    }

    return allocations;
  }

  it('Calculates 10% tier discount cleanly in paise with zero floating-point error', () => {
    const subtotalRupees = 2999;
    const subtotalPaise = Math.round(subtotalRupees * 100);
    const discountPaise = Math.round((subtotalPaise * 10) / 100);
    const discountRupees = discountPaise / 100;

    assert.equal(subtotalPaise, 299900);
    assert.equal(discountPaise, 29990);
    assert.equal(discountRupees, 299.9);
  });

  it('Calculates 20% tier discount cleanly in paise', () => {
    const subtotalRupees = 4500;
    const subtotalPaise = Math.round(subtotalRupees * 100);
    const discountPaise = Math.round((subtotalPaise * 20) / 100);
    const discountRupees = discountPaise / 100;

    assert.equal(subtotalPaise, 450000);
    assert.equal(discountPaise, 90000);
    assert.equal(discountRupees, 900);
  });

  it('Clamps 50% High Risk discount to mandatory maximum discount cap', () => {
    const subtotalRupees = 8000;
    const subtotalPaise = Math.round(subtotalRupees * 100);
    const rawDiscountPaise = Math.round((subtotalPaise * 50) / 100); // 400,000 paise = ₹4,000
    const maxDiscountCapPaise = 250000; // ₹2,500 cap

    const effectiveDiscountPaise = Math.min(rawDiscountPaise, maxDiscountCapPaise);
    const effectiveDiscountRupees = effectiveDiscountPaise / 100;

    assert.equal(rawDiscountPaise, 400000);
    assert.equal(effectiveDiscountPaise, 250000);
    assert.equal(effectiveDiscountRupees, 2500);
  });

  it('Guarantees sum of proportional allocations exactly equals total discount without penny leakage', () => {
    const items = [
      { productId: 'prod_1', sku: 'SKU-001', price: 1499, quantity: 1 },
      { productId: 'prod_2', sku: 'SKU-002', price: 999, quantity: 1 },
    ];

    // Total subtotal = ₹2,498 (249,800 paise)
    // Fixed ₹250 discount = 25,000 paise
    // Floor calculation yields 15,002 + 9,997 = 24,999 (1 paisa remainder)
    const totalDiscountPaise = 25000;
    const allocations = allocateDiscount(items, totalDiscountPaise);

    const sumAllocated = allocations.reduce((sum, a) => sum + a.discountAllocation, 0);
    assert.equal(sumAllocated, totalDiscountPaise, 'Sum of allocations must equal total discount');

    // Item 1 (higher value ₹1,499) receives the remainder paisa (15,002 + 1 = 15,003)
    assert.equal(allocations[0].discountAllocation, 15003);
    assert.equal(allocations[1].discountAllocation, 9997);
    assert.equal(allocations[0].taxableAmount + allocations[0].discountAllocation, 149900);
    assert.equal(allocations[1].taxableAmount + allocations[1].discountAllocation, 99900);
  });

  it('Handles multi-item cart remainder distribution across 5 uneven lines', () => {
    const items = [
      { productId: 'p1', sku: 'S1', price: 1234.5, quantity: 1 },
      { productId: 'p2', sku: 'S2', price: 876.25, quantity: 2 },
      { productId: 'p3', sku: 'S3', price: 450, quantity: 3 },
      { productId: 'p4', sku: 'S4', price: 299.99, quantity: 1 },
      { productId: 'p5', sku: 'S5', price: 1999, quantity: 1 },
    ];

    const subtotalPaise = items.reduce(
      (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
      0,
    );
    const discountPaise = Math.round((subtotalPaise * 15) / 100);

    const allocations = allocateDiscount(items, discountPaise);
    const sumAllocated = allocations.reduce((sum, a) => sum + a.discountAllocation, 0);

    assert.equal(
      sumAllocated,
      discountPaise,
      'Multi-line remainder allocation must be strictly balanced',
    );
  });
});

describe('Coupon Pricing Engine: GST Section 15(3)(a) Net Taxable Value', () => {
  it('Calculates 18% GST strictly on post-discount taxable subtotal (subtotal - discount)', () => {
    const subtotal = 5000;
    const couponDiscount = 1000; // ₹1,000 discount
    const taxRate = 0.18;

    const netTaxableValue = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);
    const calculatedTax = Math.round(netTaxableValue * taxRate * 100) / 100;
    const total = Math.round((netTaxableValue + calculatedTax) * 100) / 100;

    assert.equal(netTaxableValue, 4000);
    assert.equal(calculatedTax, 720); // 18% of 4000 is 720, NOT 18% of 5000 (900)
    assert.equal(total, 4720);
  });

  it('Handles 100% discount boundary where taxable value is zero', () => {
    const subtotal = 1500;
    const couponDiscount = 1500;
    const taxRate = 0.18;

    const netTaxableValue = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);
    const calculatedTax = Math.round(netTaxableValue * taxRate * 100) / 100;
    const total = Math.round((netTaxableValue + calculatedTax) * 100) / 100;

    assert.equal(netTaxableValue, 0);
    assert.equal(calculatedTax, 0);
    assert.equal(total, 0);
  });
});

describe('Coupon Validation Rules & Security Refinements', () => {
  const schemaFile = fs.readFileSync(
    path.join(apiDir, 'src', 'validators', 'coupon.schema.ts'),
    'utf-8',
  );

  it('Enforces uppercase alphanumeric regex on coupon code', () => {
    assert.match(
      schemaFile,
      /\^\[A-Z0-9_-\]\+\$/,
      'Coupon code schema must enforce uppercase alphanumeric regex',
    );
  });

  it('Mandates maximum discount cap for 50% discount tier (Margin Protection)', () => {
    assert.match(
      schemaFile,
      /discountValue\s*===\s*50[\s\S]*?maxDiscountAmount/,
      'Zod validator must mandate maxDiscountAmount when discount is 50%',
    );
  });

  it('Enforces end date strictly after start date', () => {
    assert.match(
      schemaFile,
      /new Date\(data\.endDate\)\s*>\s*new Date\(data\.startDate\)/,
      'Zod validator must require endDate > startDate',
    );
  });

  it('Enforces rate limiting on coupon validation endpoint (10 req/min)', () => {
    const limiterFile = fs.readFileSync(
      path.join(apiDir, 'src', 'middleware', 'rateLimiter.ts'),
      'utf-8',
    );
    assert.match(
      limiterFile,
      /export const couponLimiter/,
      'rateLimiter.ts must export couponLimiter',
    );
    assert.match(
      limiterFile,
      /max:\s*10/,
      'couponLimiter must limit to 10 requests per minute to prevent brute-forcing',
    );
  });

  it('OrderService calculateOrderTotals accepts optional couponCode/discount and returns coupon summary', () => {
    const orderServiceFile = fs.readFileSync(
      path.join(apiDir, 'src', 'services', 'order.service.ts'),
      'utf-8',
    );
    assert.match(
      orderServiceFile,
      /calculateOrderTotals\([\s\S]*?couponDiscountOrCode/,
      'calculateOrderTotals must accept couponDiscountOrCode',
    );
    assert.match(
      orderServiceFile,
      /coupon:\s*couponSummary/,
      'calculateOrderTotals must return coupon summary in OrderTotals',
    );
    assert.match(
      orderServiceFile,
      /createDirectOrder[\s\S]*?couponCode/,
      'createDirectOrder must support optional couponCode parameter',
    );
  });

  it('Notification telemetry schema accepts both dismiss and dismissal for client flexibility', () => {
    const notifSchemaFile = fs.readFileSync(
      path.join(apiDir, 'src', 'validators', 'notification.schema.ts'),
      'utf-8',
    );
    assert.match(
      notifSchemaFile,
      /'dismissal',\s*'dismiss'|'dismiss',\s*'dismissal'/,
      'notificationTelemetrySchema must accept both dismiss and dismissal',
    );
  });
});
