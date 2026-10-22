/**
 * Backend Hardening & Edge-Case Verification Suite
 * 
 * Verifies:
 * 1. Dual-tier inventory prevents double stock decrements during payment verification.
 * 2. Checkout reservation rollback under stock exhaustion.
 * 3. Refresh token rotation with family revocation on replay attacks (even for expired tokens).
 * 4. User address management: auto-defaulting first address, default toggling, and fallback on deletion.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { Product } from '../apps/api/dist/models/Product.model.js';
import { Order } from '../apps/api/dist/models/Order.model.js';
import { User } from '../apps/api/dist/models/User.model.js';
import { RefreshToken } from '../apps/api/dist/models/RefreshToken.model.js';
import { Reservation } from '../apps/api/dist/models/Reservation.model.js';
import { orderService } from '../apps/api/dist/services/order.service.js';
import { inventoryService } from '../apps/api/dist/services/inventory.service.js';
import { authService, signRefreshToken } from '../apps/api/dist/services/auth.service.js';
import { userService } from '../apps/api/dist/services/user.service.js';
import { RAZORPAY_KEY_SECRET } from '../apps/api/dist/config/razorpay.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vertex';

describe('Backend Hardening Empirical Verification Suite', () => {
  let sampleProduct;
  let sampleUser;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // Ensure sample product exists
    sampleProduct = await Product.findOne().lean();
    assert.ok(sampleProduct, 'Product must exist in database');

    // Create a temporary test user
    const testEmail = `test_harden_${Date.now()}@vertex.test`;
    sampleUser = await User.create({
      name: 'Hardening Tester',
      email: testEmail,
      password: 'Password123!',
      role: 'customer',
    });
  });

  after(async () => {
    if (sampleUser) {
      await User.deleteOne({ _id: sampleUser._id });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ==========================================================================
  // SECTION 1: Dual-Tier Inventory Reservation & Single-Decrement Guarantee
  // ==========================================================================
  describe('1. Dual-Tier Inventory & Zero Double-Decrement Guard', () => {
    it('Reserves stock during checkout creation and permanently captures without double decrement', async () => {
      // 1. Create a dedicated test product with known initial stock
      const initialStock = 10;
      const sku = `TEST-DUAL-${Date.now()}`;
      const prod = await Product.create({
        name: 'Dual Tier Test Jacket',
        slug: `dual-tier-test-${Date.now()}`,
        brand: 'VERTEX',
        category: 'outerwear',
        description: 'Test jacket for dual tier inventory',
        price: 120,
        inStock: true,
        isPublished: true,
        variants: [
          {
            sku,
            color: 'Black',
            colorHex: '#000000',
            size: 'M',
            price: 120,
            stock: initialStock,
            reservedStock: 0,
            imageUrl: 'https://example.com/test.jpg',
            secondaryImageUrl: 'https://example.com/test-sec.jpg',
          },
        ],
      });

      try {
        // 2. Initiate order for 2 items
        const quantityToBuy = 2;
        const orderRes = await orderService.createRazorpayOrder(
          [{ productId: prod._id.toString(), sku, quantity: quantityToBuy }],
          {
            fullName: 'Test Buyer',
            street: '123 Tech Way',
            city: 'Neo Tokyo',
            postalCode: '10001',
            country: 'IN',
            phone: '9999999999',
          },
          sampleUser._id.toString(),
        );

        // Verify stock immediately after reservation
        const reservedProd = await Product.findById(prod._id).lean();
        const reservedVariant = reservedProd.variants.find((v) => v.sku === sku);
        assert.equal(
          reservedVariant.stock,
          initialStock - quantityToBuy,
          'Available stock must be decremented by quantity',
        );
        assert.equal(
          reservedVariant.reservedStock,
          quantityToBuy,
          'Reserved stock must be incremented by quantity',
        );

        // Verify active reservation exists
        const reservation = await Reservation.findOne({
          razorpayOrderId: orderRes.razorpayOrderId,
          status: 'active',
        });
        assert.ok(reservation, 'Active reservation document must be created');

        // 3. Verify payment with valid HMAC signature
        const paymentId = `pay_${Date.now()}`;
        const hmacBody = `${orderRes.razorpayOrderId}|${paymentId}`;
        const validSignature = crypto
          .createHmac('sha256', RAZORPAY_KEY_SECRET)
          .update(hmacBody)
          .digest('hex');

        await orderService.verifyPayment({
          orderId: orderRes.orderId.toString(),
          razorpayOrderId: orderRes.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

        // 4. Verify post-capture inventory: NO DOUBLE DECREMENT!
        const settledProd = await Product.findById(prod._id).lean();
        const settledVariant = settledProd.variants.find((v) => v.sku === sku);

        assert.equal(
          settledVariant.stock,
          initialStock - quantityToBuy,
          `Stock must remain ${initialStock - quantityToBuy} (MUST NOT be double-decremented to ${initialStock - 2 * quantityToBuy})`,
        );
        assert.equal(
          settledVariant.reservedStock,
          0,
          'Reserved stock must return to 0 after capture',
        );

        // 5. Verify reservation status is captured
        const settledRes = await Reservation.findOne({
          razorpayOrderId: orderRes.razorpayOrderId,
        });
        assert.equal(settledRes.status, 'captured');
      } finally {
        await Product.deleteOne({ _id: prod._id });
      }
    });

    it('Releases held stock back to available stock if reservation is released or expires', async () => {
      const initialStock = 5;
      const sku = `TEST-RELEASE-${Date.now()}`;
      const prod = await Product.create({
        name: 'Release Test Shorts',
        slug: `release-test-${Date.now()}`,
        brand: 'VERTEX',
        category: 'bottoms',
        description: 'Test shorts',
        price: 80,
        inStock: true,
        isPublished: true,
        variants: [
          {
            sku,
            color: 'Volt',
            colorHex: '#E8FF00',
            size: 'L',
            price: 80,
            stock: initialStock,
            reservedStock: 0,
            imageUrl: 'https://example.com/test.jpg',
            secondaryImageUrl: 'https://example.com/test-sec.jpg',
          },
        ],
      });

      try {
        const orderRes = await orderService.createRazorpayOrder(
          [{ productId: prod._id.toString(), sku, quantity: 3 }],
          {
            fullName: 'Test Releaser',
            street: '123 Tech Way',
            city: 'Neo Tokyo',
            postalCode: '10001',
            country: 'IN',
            phone: '9999999999',
          },
          sampleUser._id.toString(),
        );

        // Release reservation (e.g. timeout or payment failed)
        await inventoryService.releaseReservation(orderRes.razorpayOrderId);

        const restoredProd = await Product.findById(prod._id).lean();
        const restoredVariant = restoredProd.variants.find((v) => v.sku === sku);
        assert.equal(restoredVariant.stock, initialStock, 'Stock must be fully restored');
        assert.equal(restoredVariant.reservedStock, 0, 'Reserved stock must be 0');
      } finally {
        await Product.deleteOne({ _id: prod._id });
      }
    });
  });

  // ==========================================================================
  // SECTION 2: Refresh Token Family Replay Detection
  // ==========================================================================
  describe('2. Refresh Token Rotation & Replay Attack Defense', () => {
    it('Detects token reuse on already revoked tokens and revokes entire family', async () => {
      // 1. Register a test user
      const reg = await authService.register({
        name: 'Token Family User',
        email: `token_family_${Date.now()}@test.com`,
        password: 'Password123!',
      });

      const initialRefreshToken = reg.refreshToken;

      // 2. Perform legitimate rotation: Token 1 -> Token 2
      const rot1 = await authService.rotateRefreshToken(initialRefreshToken);
      assert.ok(rot1.token, 'New access token issued');
      assert.ok(rot1.refreshToken, 'New refresh token issued');

      // 3. Attacker attempts to replay Token 1 (already revoked)
      await assert.rejects(
        () => authService.rotateRefreshToken(initialRefreshToken),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.match(err.message, /Token reuse detected/i);
          return true;
        },
      );

      // 4. Token 2 should now also be revoked because the entire family was compromised!
      await assert.rejects(
        () => authService.rotateRefreshToken(rot1.refreshToken),
        (err) => {
          assert.equal(err.statusCode, 401);
          return true;
        },
      );

      // Clean up
      await User.deleteOne({ _id: reg.user._id });
    });

    it('Detects token reuse even if the replayed token has expired', async () => {
      const user = await User.create({
        name: 'Expired Replay User',
        email: `expired_replay_${Date.now()}@test.com`,
        password: 'Password123!',
      });

      const familyId = crypto.randomUUID();
      const secret = process.env.JWT_REFRESH_SECRET || '4044plbw7MAxaHGi1KJAsOrKttSRaTqP18QNxH2IzoE';
      
      // Sign an already expired refresh token (-1s)
      const expiredToken = jwt.sign(
        { _id: user._id.toString(), familyId },
        secret,
        { expiresIn: '-1s' },
      );

      const tokenHash = crypto.createHash('sha256').update(expiredToken).digest('hex');

      // Save as already revoked in database
      await RefreshToken.create({
        tokenHash,
        userId: user._id,
        familyId,
        isRevoked: true,
        expiresAt: new Date(Date.now() + 60000),
      });

      // Also create an active sibling token in the same family
      const siblingToken = signRefreshToken({ _id: user._id.toString(), familyId });
      const siblingHash = crypto.createHash('sha256').update(siblingToken).digest('hex');
      await RefreshToken.create({
        tokenHash: siblingHash,
        userId: user._id,
        familyId,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
      });

      // Attacker replays the expired revoked token
      await assert.rejects(
        () => authService.rotateRefreshToken(expiredToken),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.match(err.message, /Token reuse detected/i);
          return true;
        },
      );

      // Sibling token must now be revoked
      const siblingRecord = await RefreshToken.findOne({ tokenHash: siblingHash });
      assert.equal(siblingRecord.isRevoked, true, 'Sibling token in family must be revoked');

      await User.deleteOne({ _id: user._id });
    });
  });

  // ==========================================================================
  // SECTION 3: User Service & Address Book Invariants
  // ==========================================================================
  describe('3. User Service & Address Book Invariants', () => {
    it('First address automatically receives isDefault: true', async () => {
      const addresses = await userService.addAddress(sampleUser._id.toString(), {
        fullName: 'Jane Doe',
        line1: '100 Alpha St',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
        phone: '9876543210',
        isDefault: false, // Explicitly false, but should default to true as first
      });

      assert.equal(addresses.length, 1);
      assert.equal(addresses[0].isDefault, true);
    });

    it('Adding second address with isDefault: true clears prior default', async () => {
      const addresses = await userService.addAddress(sampleUser._id.toString(), {
        fullName: 'Jane Doe Office',
        line1: '200 Beta Tower',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400002',
        country: 'IN',
        phone: '9876543211',
        isDefault: true,
      });

      assert.equal(addresses.length, 2);
      assert.equal(addresses[0].isDefault, false, 'First address must no longer be default');
      assert.equal(addresses[1].isDefault, true, 'Second address must now be default');
    });

    it('Deleting the default address designates remaining address as default', async () => {
      const user = await User.findById(sampleUser._id);
      const defaultAddrId = user.addresses.find((a) => a.isDefault)._id.toString();

      const remainingAddresses = await userService.deleteAddress(
        sampleUser._id.toString(),
        defaultAddrId,
      );

      assert.equal(remainingAddresses.length, 1);
      assert.equal(remainingAddresses[0].isDefault, true, 'Remaining address promoted to default');
    });
  });
});
