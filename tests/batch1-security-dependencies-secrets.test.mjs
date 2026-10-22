/**
 * Batch 1 Verification Test Suite: Critical Security, Dependencies & Secrets
 * Findings Verified:
 * - CRIT-05: Next.js patched version (>= 15.5.28), RCE vulnerability resolved
 * - MED-06: Sharp and PostCSS dependency overrides in place
 * - HIGH-01: Legacy "Vertex" and "XLRV" branding purged from cookies, keys, storage, placeholders
 * - HIGH-08: Admin token migrated to in-memory store + httpOnly refresh cookie
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

describe('Batch 1: CRIT-05 - Next.js Security Upgrades', () => {
  it('Next.js is upgraded to >= 15.5.28 in apps/web/package.json', () => {
    const webPkg = JSON.parse(fs.readFileSync(path.join(webDir, 'package.json'), 'utf-8'));
    assert.ok(webPkg.dependencies.next, 'next must be a dependency in apps/web');
    const versionMatch = webPkg.dependencies.next.match(/(\d+)\.(\d+)\.(\d+)/);
    assert.ok(versionMatch, 'next version must match semver');
    const [_, major, minor, patch] = versionMatch.map(Number);
    // Must be at least 15.5.28
    assert.ok(
      major > 15 || (major === 15 && (minor > 5 || (minor === 5 && patch >= 28))),
      `next version must be >= 15.5.28, found ${webPkg.dependencies.next}`,
    );
  });

  it('eslint-config-next is aligned with patched Next.js version', () => {
    const webPkg = JSON.parse(fs.readFileSync(path.join(webDir, 'package.json'), 'utf-8'));
    assert.ok(webPkg.devDependencies['eslint-config-next'], 'eslint-config-next must exist');
    assert.strictEqual(webPkg.devDependencies['eslint-config-next'], '15.5.28');
  });
});

describe('Batch 1: MED-06 - Dependency Vulnerabilities & Overrides', () => {
  it('Root package.json includes security overrides for sharp and postcss', () => {
    const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
    assert.ok(rootPkg.overrides, 'root package.json must specify overrides');
    assert.ok(rootPkg.overrides.postcss, 'postcss override must be present');
    assert.ok(rootPkg.overrides.sharp, 'sharp override must be present');
  });
});

describe('Batch 1: HIGH-01 - Purge Legacy Vertex and XLRV Branding', () => {
  it('Refresh cookie is standardized to xydv_refresh_token with backward compatibility', () => {
    const authController = fs.readFileSync(
      path.join(apiDir, 'src', 'controllers', 'auth.controller.ts'),
      'utf-8',
    );
    assert.match(authController, /REFRESH_COOKIE_NAME\s*=\s*'xydv_refresh_token'/);
    assert.match(authController, /LEGACY_REFRESH_COOKIE_NAME\s*=\s*'vertex_refresh_token'/);
    assert.match(authController, /res\.clearCookie\(REFRESH_COOKIE_NAME\)/);
    assert.match(authController, /res\.clearCookie\(LEGACY_REFRESH_COOKIE_NAME\)/);
  });

  it('Cart persistence store uses xydv-cart with seamless migration', () => {
    const cartStore = fs.readFileSync(path.join(webDir, 'src', 'store', 'cart.ts'), 'utf-8');
    assert.match(cartStore, /name:\s*'xydv-cart'/);
    assert.match(cartStore, /localStorage\.getItem\('vertex-cart'\)/);
  });

  it('Wishlist persistence store uses xydv-wishlist with seamless migration', () => {
    const wishlistStore = fs.readFileSync(
      path.join(webDir, 'src', 'store', 'wishlist.ts'),
      'utf-8',
    );
    assert.match(wishlistStore, /name:\s*'xydv-wishlist'/);
    assert.match(wishlistStore, /localStorage\.getItem\('vertex-wishlist'\)/);
  });

  it('Admin login and sidebar reference admin@xydv.com', () => {
    const loginPage = fs.readFileSync(
      path.join(webDir, 'src', 'app', 'admin', 'login', 'page.tsx'),
      'utf-8',
    );
    assert.match(loginPage, /placeholder="admin@xydv\.com"/);

    const sidebar = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'admin', 'AdminSidebar.tsx'),
      'utf-8',
    );
    assert.match(sidebar, /admin@xydv\.com/);

    const seedAdmin = fs.readFileSync(
      path.join(apiDir, 'src', 'scripts', 'seed-admin.ts'),
      'utf-8',
    );
    assert.match(seedAdmin, /admin@xydv\.com/);
  });

  it('CartDrawer and backend config use xydv Razorpay test key placeholders', () => {
    const cartDrawer = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'store', 'CartDrawer.tsx'),
      'utf-8',
    );
    assert.match(cartDrawer, /rzp_test_xydv2026/);

    const envConfig = fs.readFileSync(path.join(apiDir, 'src', 'config', 'env.ts'), 'utf-8');
    assert.match(envConfig, /rzp_test_xydv_key/);
    assert.match(envConfig, /xydv_test_secret/);
    assert.match(envConfig, /xydv_webhook_secret/);

    const rootEnvExample = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf-8');
    assert.match(rootEnvExample, /rzp_test_xydv_key/);

    const apiEnvExample = fs.readFileSync(path.join(apiDir, '.env.example'), 'utf-8');
    assert.match(apiEnvExample, /# XYDV API/);
    assert.match(apiEnvExample, /rzp_test_xydv_key/);
    assert.doesNotMatch(apiEnvExample, /XLRV/);
  });

  it('Server logs and upload folders identify as XYDV', () => {
    const serverTs = fs.readFileSync(path.join(apiDir, 'src', 'server.ts'), 'utf-8');
    assert.match(serverTs, /XYDV API running on/);

    const uploadTs = fs.readFileSync(path.join(apiDir, 'src', 'middleware', 'upload.ts'), 'utf-8');
    assert.match(uploadTs, /xydv_products/);
  });

  it('Theme preference and announcement dismissal use xydv keys with legacy fallback', () => {
    const themeToggle = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'ui', 'ThemeToggle.tsx'),
      'utf-8',
    );
    assert.match(themeToggle, /localStorage\.getItem\('xydv-theme'\)/);
    assert.match(themeToggle, /localStorage\.getItem\('vertex-theme'\)/);
    assert.match(themeToggle, /localStorage\.setItem\('xydv-theme'/);
    assert.match(themeToggle, /localStorage\.removeItem\('vertex-theme'\)/);

    const layout = fs.readFileSync(path.join(webDir, 'src', 'app', 'layout.tsx'), 'utf-8');
    assert.match(layout, /localStorage\.getItem\('xydv-theme'\)/);

    const announcement = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'layout', 'AnnouncementBar.tsx'),
      'utf-8',
    );
    assert.match(announcement, /localStorage\.getItem\('xydv-announcement-dismissed'\)/);
    assert.match(announcement, /localStorage\.setItem\('xydv-announcement-dismissed'/);

    const openapi = fs.readFileSync(path.join(apiDir, 'openapi.yaml'), 'utf-8');
    assert.match(openapi, /api\.xydv\.com/);
    assert.doesNotMatch(openapi, /vertex-fashion/);
  });
});

describe('Batch 1: HIGH-08 - Admin Auth Token In-Memory & Secure Cookie Migration', () => {
  it('Admin login does not persist token to localStorage', () => {
    const adminAuth = fs.readFileSync(path.join(webDir, 'src', 'store', 'adminAuth.ts'), 'utf-8');
    assert.doesNotMatch(adminAuth, /localStorage\.setItem\('vertex_admin_token'/);
    assert.doesNotMatch(adminAuth, /localStorage\.setItem\('xydv_admin_token'/);
    assert.match(adminAuth, /setAccessToken\(token\)/);
  });

  it('Admin store implements silent session renewal via /auth/refresh and token observers', () => {
    const adminAuth = fs.readFileSync(path.join(webDir, 'src', 'store', 'adminAuth.ts'), 'utf-8');
    assert.match(adminAuth, /api\.post[\s\S]*'\/auth\/refresh'/);
    assert.match(adminAuth, /onAccessTokenChange/);
    assert.match(adminAuth, /setAccessToken\(token\)/);
  });

  it('api.ts manages access token in memory with getAccessToken/setAccessToken and observer', () => {
    const apiTs = fs.readFileSync(path.join(webDir, 'src', 'lib', 'api.ts'), 'utf-8');
    assert.match(apiTs, /export function setAccessToken/);
    assert.match(apiTs, /export function getAccessToken/);
    assert.match(apiTs, /export function onAccessTokenChange/);
    assert.match(apiTs, /inMemoryAccessToken/);
  });

  it('api.ts transparently intercepts 401 and attempts single-flight token refresh', () => {
    const apiTs = fs.readFileSync(path.join(webDir, 'src', 'lib', 'api.ts'), 'utf-8');
    assert.match(apiTs, /requestTokenRefresh/);
    assert.match(apiTs, /refreshPromise/);
    assert.match(apiTs, /_isRetry/);
    assert.match(apiTs, /isAuthEndpoint/);
  });

  it('AdminGuard awaits initialize before rendering protected view', () => {
    const adminGuard = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'admin', 'AdminGuard.tsx'),
      'utf-8',
    );
    assert.match(adminGuard, /await initialize\(\)/);
  });
});
