/**
 * Batch 4 Verification Test Suite: Dynamic Categories & Taxonomy
 * Finding Verified:
 * - HIGH-02: Hardcoded Dynamic Categories & Taxonomy in Navbar and Product Service
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

describe('Batch 4: HIGH-02 - Dynamic Categories & Taxonomy in Product Service', () => {
  const productServiceSrc = fs.readFileSync(
    path.join(apiDir, 'src', 'services', 'product.service.ts'),
    'utf-8',
  );
  const apiRoutesSrc = fs.readFileSync(
    path.join(apiDir, 'src', 'routes', 'index.ts'),
    'utf-8',
  );

  it('product.service.ts eliminates hardcoded allCategories list', () => {
    assert.doesNotMatch(
      productServiceSrc,
      /const allCategories\s*=\s*\[\s*['"]T-Shirts['"]/,
      'product.service.ts must not contain the hardcoded allCategories array',
    );
  });

  it('product.service.ts dynamically queries Category and Product models for taxonomy', () => {
    assert.match(
      productServiceSrc,
      /Category\.find|\.aggregate\(/,
      'product.service.ts must query Category collection or aggregate from Product collection',
    );
    assert.match(
      productServiceSrc,
      /getCategories\s*\(/,
      'product.service.ts must export getCategories() method',
    );
  });

  it('apps/api/src/routes/index.ts mounts public categories route', () => {
    assert.match(
      apiRoutesSrc,
      /\/categories/,
      'apps/api/src/routes/index.ts must mount the /categories route',
    );
  });

  it('product.service.ts aggregates categories case-insensitively with $toLower', () => {
    assert.match(
      productServiceSrc,
      /\$toLower:\s*['"]\$category['"]/,
      'product.service.ts must group categories with $toLower for case-insensitive normalization',
    );
  });
});

describe('Batch 4: HIGH-02 - Next.js Route Proxy & Storefront Navbar Integration', () => {
  const categoriesRoutePath = path.join(webDir, 'src', 'app', 'api', 'categories', 'route.ts');
  const navbarSrc = fs.readFileSync(
    path.join(webDir, 'src', 'components', 'layout', 'Navbar.tsx'),
    'utf-8',
  );

  it('apps/web/src/app/api/categories/route.ts exists and proxies to backend API', () => {
    assert.ok(
      fs.existsSync(categoriesRoutePath),
      'apps/web/src/app/api/categories/route.ts must exist',
    );
    const routeSrc = fs.readFileSync(categoriesRoutePath, 'utf-8');
    assert.match(
      routeSrc,
      /fetch\(\s*(`|\$\{API_BASE_URL\}\/categories|API_BASE_URL)/,
      'categories route handler must forward requests to backend Express /categories',
    );
    assert.match(
      routeSrc,
      /export\s+async\s+function\s+GET/,
      'categories route handler must export GET handler',
    );
  });

  it('Navbar.tsx dynamically loads categories from API and merges into navigation', () => {
    assert.match(
      navbarSrc,
      /\/api\/categories/,
      'Navbar.tsx must fetch dynamic taxonomy from /api/categories',
    );
    assert.match(
      navbarSrc,
      /useEffect|\.then|\.json/,
      'Navbar.tsx must handle asynchronous category fetching on mount',
    );
    assert.match(
      navbarSrc,
      /navLinks/,
      'Navbar.tsx must use reactive navLinks to render dynamic category navigation',
    );
  });

  it('Navbar.tsx satisfies WCAG semantic navigation attributes', () => {
    assert.match(
      navbarSrc,
      /aria-label=["']Main navigation["']|aria-label=["']Mobile navigation["']/,
      'Navbar.tsx must provide accessible aria-label on navigation landmark',
    );
  });
});
