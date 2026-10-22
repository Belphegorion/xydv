/**
 * Batch 9 Verification Test Suite: Admin UX Polish & Form Hardening
 * Findings Verified:
 * - MED-01: Public Settings Endpoint / Route Handler parity
 * - MED-07: Dynamic Announcement Bar thresholds from Store Settings
 * - MED-08: Dirty Form Guard / beforeunload handler in Admin Settings and Products
 * - MED-09: Real dynamic product rating computation in BestsellerGrid
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

describe('Batch 9: MED-01 - Public Settings Endpoint Proxy', () => {
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
});

describe('Batch 9: MED-07 - Dynamic Announcement Bar', () => {
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
  it('BestsellerGrid computes dynamic rating from product data', () => {
    const filePath = path.join(webDir, 'src', 'components', 'store', 'BestsellerGrid.tsx');
    assert.ok(fs.existsSync(filePath), 'BestsellerGrid.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.match(
      content,
      /product\.reviews|product\.rating|reviewCount/,
      'BestsellerGrid must dynamically calculate ratings from product reviews/rating',
    );
    assert.doesNotMatch(
      content,
      /<span[^>]*>\s*4\.9\s*<\/span>/,
      'BestsellerGrid must not hardcode static 4.9 rating',
    );
  });
});
