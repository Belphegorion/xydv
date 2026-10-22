/**
 * Batch 9 Verification Test Suite: Admin UX Polish & Form Hardening
 * Findings Verified:
 * - MED-01: Connect announcement bar text to dynamic store settings (GET /api/settings)
 * - MED-07: Purge unused endpoints or link them
 * - MED-08: Add unsaved-changes dirty guard on admin settings and product edit forms
 * - MED-09: In BestsellerGrid.tsx: Render real average rating and review count from product.ratings or product.reviews
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
const webDir = path.join(rootDir, 'apps', 'web');

describe('Batch 9: MED-01 - Dynamic Announcement Bar & Store Settings Parity', () => {
  it('Next.js API settings route handler exists and exports GET', () => {
    const routePath = path.join(webDir, 'src', 'app', 'api', 'settings', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'apps/web/src/app/api/settings/route.ts must exist');

    const content = fs.readFileSync(routePath, 'utf-8');
    assert.match(
      content,
      /export\s+async\s+function\s+GET/,
      'route.ts must export async function GET',
    );
    assert.match(content, /freeShippingThreshold/, 'route.ts must handle freeShippingThreshold');
    assert.match(content, /currencySymbol/, 'route.ts must handle currencySymbol');
  });

  it('AnnouncementBar dynamically loads settings and formats threshold', () => {
    const filePath = path.join(webDir, 'src', 'components', 'layout', 'AnnouncementBar.tsx');
    assert.ok(fs.existsSync(filePath), 'AnnouncementBar.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.match(
      content,
      /\/api\/settings|\/settings/,
      'AnnouncementBar must query settings endpoint',
    );
    assert.match(
      content,
      /freeShippingThreshold/,
      'AnnouncementBar must read freeShippingThreshold',
    );
    assert.match(content, /currencySymbol/, 'AnnouncementBar must read currencySymbol');
  });
});

describe('Batch 9: MED-07 - Unused Endpoints Purged or Linked', () => {
  it('apiRouter correctly links all domain routers and public routes', () => {
    const indexPath = path.join(apiDir, 'src', 'routes', 'index.ts');
    assert.ok(fs.existsSync(indexPath), 'routes/index.ts must exist');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.match(content, /apiRouter\.use\(['"]\/products['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/auth['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/orders['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/users['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/admin['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/webhooks['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/settings['"]/);
    assert.match(content, /apiRouter\.use\(['"]\/support['"]/);
  });
});

describe('Batch 9: MED-08 - Dirty Form Guards (beforeunload)', () => {
  it('Admin Settings page registers beforeunload event listener tied to isDirty', () => {
    const filePath = path.join(webDir, 'src', 'app', 'admin', 'settings', 'page.tsx');
    assert.ok(fs.existsSync(filePath), 'admin/settings/page.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.match(
      content,
      /window\.addEventListener\(['"]beforeunload['"]/,
      'Settings page must attach beforeunload listener',
    );
    assert.match(
      content,
      /window\.removeEventListener\(['"]beforeunload['"]/,
      'Settings page must clean up beforeunload listener',
    );
    assert.match(content, /isDirty/, 'Settings page must guard beforeunload against isDirty');
  });

  it('Admin Products page registers beforeunload event listener tied to isDirty', () => {
    const filePath = path.join(webDir, 'src', 'app', 'admin', 'products', 'page.tsx');
    assert.ok(fs.existsSync(filePath), 'admin/products/page.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.match(
      content,
      /window\.addEventListener\(['"]beforeunload['"]/,
      'Products page must attach beforeunload listener',
    );
    assert.match(
      content,
      /window\.removeEventListener\(['"]beforeunload['"]/,
      'Products page must clean up beforeunload listener',
    );
    assert.match(content, /isDirty/, 'Products page must guard beforeunload against isDirty');
  });
});

describe('Batch 9: MED-09 - Dynamic Product Rating Computation', () => {
  it('BestsellerGrid implements computeDynamicRating handling product.ratings and product.reviews', () => {
    const filePath = path.join(webDir, 'src', 'components', 'store', 'BestsellerGrid.tsx');
    assert.ok(fs.existsSync(filePath), 'BestsellerGrid.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.match(
      content,
      /computeDynamicRating/,
      'BestsellerGrid must declare computeDynamicRating helper',
    );
    assert.match(
      content,
      /product\.reviews/,
      'computeDynamicRating must support product.reviews calculation',
    );
    assert.match(
      content,
      /product\.ratings/,
      'computeDynamicRating must support product.ratings calculation',
    );
  });
});
