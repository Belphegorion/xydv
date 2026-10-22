/**
 * Batch 5 Verification Test Suite: Customer Lifecycle & Checkout UX
 * Finding Verified:
 * - HIGH-03: Missing Customer Account UI and Hardcoded Athlete Customer Checkout Prefill
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

describe('Batch 5: HIGH-03 - Customer Auth Storefront Store', () => {
  const customerAuthStorePath = path.join(webDir, 'src', 'store', 'customerAuth.ts');

  it('customerAuth.ts exists and exports useCustomerAuthStore', () => {
    assert.ok(
      fs.existsSync(customerAuthStorePath),
      'apps/web/src/store/customerAuth.ts must exist',
    );
    const storeSrc = fs.readFileSync(customerAuthStorePath, 'utf-8');
    assert.match(
      storeSrc,
      /export\s+const\s+useCustomerAuthStore\s*=\s*create/,
      'customerAuth.ts must export useCustomerAuthStore Zustand hook',
    );
    assert.match(storeSrc, /isModalOpen/, 'customerAuth.ts must manage isModalOpen state');
    assert.match(
      storeSrc,
      /authMode|modalMode/,
      'customerAuth.ts must manage auth mode state ("login" | "register")',
    );
    assert.match(storeSrc, /login\s*:\s*async/, 'customerAuth.ts must implement login action');
    assert.match(
      storeSrc,
      /register\s*:\s*async/,
      'customerAuth.ts must implement register action',
    );
    assert.match(storeSrc, /logout\s*:\s*\(\)/, 'customerAuth.ts must implement logout action');
    assert.match(
      storeSrc,
      /localStorage\.setItem\(['"]xydv_auth_token['"]/,
      'customerAuth.ts must persist xydv_auth_token in localStorage on login/register',
    );
    assert.match(
      storeSrc,
      /setAccessToken\(storedToken\)/,
      'customerAuth.ts must restore access token in api client during initialize()',
    );
  });
});

describe('Batch 5: HIGH-03 - CustomerAuthModal Component & Layout Integration', () => {
  const modalPath = path.join(webDir, 'src', 'components', 'store', 'CustomerAuthModal.tsx');
  const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
  const navbarPath = path.join(webDir, 'src', 'components', 'layout', 'Navbar.tsx');

  it('CustomerAuthModal.tsx exists and implements accessible modal dialog with Emil Kowalski motion', () => {
    assert.ok(fs.existsSync(modalPath), 'CustomerAuthModal.tsx must exist in components/store');
    const modalSrc = fs.readFileSync(modalPath, 'utf-8');
    assert.match(modalSrc, /role=["']dialog["']/, 'CustomerAuthModal must specify role="dialog"');
    assert.match(
      modalSrc,
      /aria-modal=["']true["']/,
      'CustomerAuthModal must specify aria-modal="true"',
    );
    assert.match(
      modalSrc,
      /AnimatePresence/,
      'CustomerAuthModal must use AnimatePresence for fluid mount/unmount transitions',
    );
    assert.doesNotMatch(
      modalSrc,
      /transition:\s*all/,
      'CustomerAuthModal must not use unconstrained transition: all',
    );
  });

  it('CustomerAuthModal.tsx renders active athlete profile and session termination when authenticated', () => {
    const modalSrc = fs.readFileSync(modalPath, 'utf-8');
    assert.match(
      modalSrc,
      /ACTIVE ATHLETE SESSION|logout/i,
      'CustomerAuthModal must support active authenticated session display and sign out',
    );
    assert.match(
      modalSrc,
      /TERMINATE SESSION|SIGN OUT/i,
      'CustomerAuthModal must provide a sign-out trigger for logged-in athletes',
    );
  });

  it('layout.tsx mounts CustomerAuthModal inside global application tree', () => {
    const layoutSrc = fs.readFileSync(layoutPath, 'utf-8');
    assert.match(
      layoutSrc,
      /CustomerAuthModal/,
      'layout.tsx must import and mount CustomerAuthModal',
    );
  });

  it('Navbar.tsx renders Customer Account trigger button with accessible label', () => {
    const navbarSrc = fs.readFileSync(navbarPath, 'utf-8');
    assert.match(
      navbarSrc,
      /useCustomerAuthStore/,
      'Navbar.tsx must connect to useCustomerAuthStore',
    );
    assert.match(
      navbarSrc,
      /Sign in to account/,
      'Navbar.tsx account button must have an accessible aria-label',
    );
  });
});

describe('Batch 5: HIGH-03 - CartDrawer Interactive Shipping Destination Form', () => {
  const cartDrawerSrc = fs.readFileSync(
    path.join(webDir, 'src', 'components', 'store', 'CartDrawer.tsx'),
    'utf-8',
  );

  it('CartDrawer.tsx includes real customer shipping form fields', () => {
    assert.match(
      cartDrawerSrc,
      /shippingAddress|deliveryAddress|fullName|addressLine1/,
      'CartDrawer.tsx must contain state or fields for delivery destination',
    );
    assert.match(
      cartDrawerSrc,
      /fullName|FULL NAME|Recipient name/i,
      'CartDrawer.tsx must collect customer full name',
    );
    assert.match(
      cartDrawerSrc,
      /shippingAddress\.phone|PHONE NUMBER/i,
      'CartDrawer.tsx must collect phone number',
    );
    assert.match(cartDrawerSrc, /shippingAddress\.city|CITY/i, 'CartDrawer.tsx must collect city');
    assert.match(
      cartDrawerSrc,
      /shippingAddress\.postalCode|PIN CODE|postalCode/i,
      'CartDrawer.tsx must collect postal code',
    );
  });

  it('CartDrawer.tsx eliminates hardcoded athlete customer name and phone in checkout', () => {
    assert.doesNotMatch(
      cartDrawerSrc,
      /name:\s*['"]Athlete Customer['"]/,
      'CartDrawer.tsx must not hardcode name: "Athlete Customer"',
    );
    assert.doesNotMatch(
      cartDrawerSrc,
      /contact:\s*['"]\+919876543210['"]/,
      'CartDrawer.tsx must not hardcode contact: "+919876543210"',
    );
  });

  it('CartDrawer.tsx connects with customerAuthStore to pre-fill customer shipping details', () => {
    assert.match(
      cartDrawerSrc,
      /useCustomerAuthStore/,
      'CartDrawer.tsx must import and connect with useCustomerAuthStore',
    );
  });

  it('CartDrawer.tsx validates shipping form before initiating payment flow', () => {
    assert.match(
      cartDrawerSrc,
      /validate|shippingError|formError|!shippingAddress/i,
      'CartDrawer.tsx must validate required shipping fields before checkout execution',
    );
  });

  it('CartDrawer.tsx includes shippingAddress in handleRazorpayCheckout dependency array to avoid stale closures', () => {
    assert.match(
      cartDrawerSrc,
      /,\s*\[[^\]]*shippingAddress[^\]]*\]/,
      'handleRazorpayCheckout must include shippingAddress in dependency array',
    );
  });

  it('CartDrawer.tsx provides accessible label associations (htmlFor / id) for all shipping inputs', () => {
    assert.match(
      cartDrawerSrc,
      /htmlFor=["']shipping-fullName["']/,
      'Full Name field must have matching htmlFor',
    );
    assert.match(
      cartDrawerSrc,
      /htmlFor=["']shipping-line1["']/,
      'Street Address field must have matching htmlFor',
    );
    assert.match(
      cartDrawerSrc,
      /htmlFor=["']shipping-city["']/,
      'City field must have matching htmlFor',
    );
    assert.match(
      cartDrawerSrc,
      /htmlFor=["']shipping-postalCode["']/,
      'PIN code field must have matching htmlFor',
    );
  });
});
