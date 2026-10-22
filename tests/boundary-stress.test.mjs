/**
 * Empirical Adversarial Challenge: Boundary Conditions & Arithmetic Stress Harness
 * Executed by m1_challenger_2 to stress-test @vertex/types contracts and commerce logic.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMERCE_RULES,
  calculateCartMetrics,
} from './harness/contracts.mjs';
import {
  LocalStorageMock,
  CartStoreSimulator,
} from './harness/client-runtime.mjs';
import { ServerRuntimeSimulator } from './harness/server-runtime.mjs';
import { CATALOG_FIXTURES } from './harness/seed-data.mjs';
import { FREE_SHIPPING_THRESHOLD } from '@vertex/types';

describe('Empirical Adversarial Challenge: Free Shipping Threshold & Subtotal Arithmetic', () => {

  it('Boundary Threshold Equality: FREE_SHIPPING_THRESHOLD matches COMMERCE_RULES.freeShippingThreshold', () => {
    assert.equal(FREE_SHIPPING_THRESHOLD, 150);
    assert.equal(COMMERCE_RULES.freeShippingThreshold, 150);
    assert.equal(FREE_SHIPPING_THRESHOLD, COMMERCE_RULES.freeShippingThreshold);
  });

  describe('Boundary Condition: Exactly $0.00 (Zero State)', () => {
    it('Empty items list produces exactly $0 subtotal, $0 shipping, $150 delta, 0% progress', () => {
      const metrics = calculateCartMetrics([]);
      assert.equal(metrics.subtotal, 0);
      assert.equal(metrics.shipping, 0);
      assert.equal(metrics.isFreeShipping, false);
      assert.equal(metrics.freeShippingDelta, 150.0);
      assert.equal(metrics.freeShippingProgress, 0);
      assert.equal(metrics.total, 0);
      assert.equal(metrics.amountPaise, 0);
    });

    it('Cart with 0-price item does not unlock free shipping and charges standard shipping', () => {
      const items = [{ price: 0, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 0);
      assert.equal(metrics.isFreeShipping, false);
      assert.equal(metrics.shipping, COMMERCE_RULES.standardShippingFee); // 9.99
      assert.equal(metrics.freeShippingDelta, 150.0);
      assert.equal(metrics.freeShippingProgress, 0);
      assert.equal(metrics.total, 9.99);
      assert.equal(metrics.amountPaise, 999);
    });
  });

  describe('Boundary Condition: The 1-Penny Cliff ($149.99 vs $150.00 vs $150.01)', () => {
    it('$149.99: Strictly locked, delta is exactly 0.01, standard shipping applied', () => {
      const items = [{ price: 149.99, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 149.99);
      assert.equal(metrics.isFreeShipping, false);
      assert.equal(metrics.shipping, 9.99);
      assert.equal(metrics.freeShippingDelta, 0.01);
      // Floating-point tax calculation: 149.99 * 0.08 = 11.9992 -> 12.00
      assert.equal(metrics.tax, 12.00);
      // Total: 149.99 + 9.99 + 12.00 = 171.98
      assert.equal(metrics.total, 171.98);
      assert.equal(metrics.amountPaise, 17198);
    });

    it('$149.999 (sub-penny rounding boundary): verifies rounding stability', () => {
      const items = [{ price: 149.999, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      // toFixed(2) rounds 149.999 to 150.00
      assert.equal(metrics.subtotal, 150.00);
      assert.equal(metrics.isFreeShipping, true);
      assert.equal(metrics.shipping, 0);
      assert.equal(metrics.freeShippingDelta, 0);
    });

    it('$150.00: Exact threshold unlocks free shipping with 0 delta and $0 shipping', () => {
      const items = [{ price: 150.00, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 150.00);
      assert.equal(metrics.isFreeShipping, true);
      assert.equal(metrics.shipping, 0);
      assert.equal(metrics.freeShippingDelta, 0);
      assert.equal(metrics.freeShippingProgress, 100);
      // Tax: 150 * 0.08 = 12.00
      assert.equal(metrics.tax, 12.00);
      assert.equal(metrics.total, 162.00);
      assert.equal(metrics.amountPaise, 16200);
    });

    it('$150.01: Exactly one penny above threshold maintains free shipping', () => {
      const items = [{ price: 150.01, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 150.01);
      assert.equal(metrics.isFreeShipping, true);
      assert.equal(metrics.shipping, 0);
      assert.equal(metrics.freeShippingDelta, 0);
      assert.equal(metrics.freeShippingProgress, 100);
      // Tax: 150.01 * 0.08 = 12.0008 -> 12.00
      assert.equal(metrics.tax, 12.00);
      assert.equal(metrics.total, 162.01);
      assert.equal(metrics.amountPaise, 16201);
    });
  });

  describe('Boundary Condition: Floating Point Multi-Item Accumulation', () => {
    it('Sum of multiple decimal items avoids JS binary floating point errors (e.g. 19.99 * 7 + 9.99 = 149.92)', () => {
      const items = [
        { price: 19.99, quantity: 7 }, // 139.93
        { price: 9.99, quantity: 1 },  // 9.99 -> 149.92
      ];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 149.92);
      assert.equal(metrics.isFreeShipping, false);
      assert.equal(metrics.freeShippingDelta, 0.08);
      assert.equal(Number.isInteger(metrics.amountPaise), true);
    });

    it('Three items summing exactly to 150.00 (50.00 * 3) cleanly unlocks free shipping', () => {
      const items = [{ price: 50.00, quantity: 3 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 150.00);
      assert.equal(metrics.isFreeShipping, true);
      assert.equal(metrics.freeShippingDelta, 0);
    });
  });

  describe('Boundary Condition: Negative Inputs & Clamping', () => {
    it('Negative item quantity safely removes or rejects item in CartStoreSimulator', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const variant = product.variants[0];

      // Attempt adding negative quantity directly
      const addRes = cart.addItem(product, variant, -3);
      assert.equal(addRes.success, false);
      assert.equal(addRes.reason, 'Invalid quantity');
      assert.equal(cart.items.length, 0);

      // Add valid item then update with negative quantity
      const addValid = cart.addItem(product, variant, 2);
      assert.equal(addValid.success, true);
      const updateRes = cart.updateQuantity(addValid.itemId, -1);
      assert.equal(updateRes.success, true);
      assert.equal(updateRes.removed, true);
      assert.equal(cart.items.length, 0);
    });

    it('Decrementation boundary from 1 to 0 removes line item without lingering zero-quantity ghost', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const variant = product.variants[0];

      const addRes = cart.addItem(product, variant, 1);
      assert.equal(cart.items.length, 1);

      cart.updateQuantity(addRes.itemId, 0);
      assert.equal(cart.items.length, 0);
      const metrics = cart.getMetrics();
      assert.equal(metrics.subtotal, 0);
      assert.equal(metrics.shipping, 0);
    });
  });

  describe('Boundary Condition: Stock Limit & Overflow Conditions', () => {
    it('Cart quantity clamping: request for 1,000,000 items is clamped strictly to maxStock', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const variant = product.variants[0]; // e.g. stock 40

      const addRes = cart.addItem(product, variant, 1000000);
      assert.equal(addRes.success, true);
      assert.equal(cart.items[0].quantity, variant.stock);
      assert.equal(cart.items[0].maxStock, variant.stock);
    });

    it('Incremental overflow: adding to cart when already at maxStock does not exceed maxStock', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const variant = product.variants[0];

      cart.addItem(product, variant, variant.stock);
      assert.equal(cart.items[0].quantity, variant.stock);

      // Attempt to add more
      cart.addItem(product, variant, 5);
      assert.equal(cart.items[0].quantity, variant.stock);
    });

    it('Extreme cart value ($1,000,000.00): subtotal and amountPaise remain safe integers', () => {
      const items = [{ price: 1000000.00, quantity: 1 }];
      const metrics = calculateCartMetrics(items);
      assert.equal(metrics.subtotal, 1000000.00);
      assert.equal(metrics.isFreeShipping, true);
      assert.equal(metrics.freeShippingDelta, 0);
      assert.equal(metrics.freeShippingProgress, 100);
      assert.equal(Number.isSafeInteger(metrics.amountPaise), true);
      assert.equal(metrics.amountPaise, 108000000); // $1,080,000.00 in paise
    });
  });

  describe('Boundary Condition: CartItem Unique Keys & Variant Merging', () => {
    it('Variant swapping generates deterministic unique itemId format (productId::variantId)', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const v1 = product.variants[0];
      const v2 = product.variants.find((v) => v.id !== v1.id && v.stock > 0);

      const addRes = cart.addItem(product, v1, 1);
      assert.equal(addRes.itemId, `${product._id}::${v1.id}`);

      const swapRes = cart.swapVariant(addRes.itemId, v2);
      assert.equal(swapRes.success, true);
      assert.equal(swapRes.newItemId, `${product._id}::${v2.id}`);
      assert.equal(cart.items[0].id, `${product._id}::${v2.id}`);
      assert.equal(cart.items[0].variant.id, v2.id);
    });

    it('Swapping to an already present variant merges quantities and respects stock ceiling', () => {
      const cart = new CartStoreSimulator();
      const product = CATALOG_FIXTURES[0];
      const v1 = product.variants[0];
      const v2 = product.variants.find((v) => v.id !== v1.id && v.stock > 0);

      cart.addItem(product, v1, 2);
      cart.addItem(product, v2, 3);
      assert.equal(cart.items.length, 2);

      // Swap v1 item into v2 -> should merge into single line item with quantity 5 (or clamped)
      const v1ItemId = `${product._id}::${v1.id}`;
      const swapRes = cart.swapVariant(v1ItemId, v2);
      assert.equal(swapRes.success, true);
      assert.equal(cart.items.length, 1);
      assert.equal(cart.items[0].id, `${product._id}::${v2.id}`);
      assert.equal(cart.items[0].quantity, Math.min(5, v2.stock));
    });
  });
});
