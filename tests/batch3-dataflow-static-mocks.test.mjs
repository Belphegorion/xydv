/**
 * Batch 3 Verification Test Suite: Data-Flow Unification & Static Mock Removal
 * Findings Verified:
 * - CRIT-01: API routes reverse-proxy to Express backend; static catalog bypass eliminated
 * - CRIT-02: Storefront products and PDP pages load strictly from backend API; no zombie resurrection
 * - CRIT-06: Real support ticket model, Express persistence, and Next.js contact proxy integration
 * - CRIT-07: Dynamic variant size and stock derivation; hardcoded VPT-VLT checks eliminated
 * - HIGH-04: Wishlist page dynamically resolves live product variants on move-to-bag
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

describe('Batch 3: CRIT-01 - API Reverse Proxy & Static Catalog Bypass Removal', () => {
  const productsRouteSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'api', 'products', 'route.ts'),
    'utf-8',
  );
  const productSlugRouteSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'api', 'products', '[slug]', 'route.ts'),
    'utf-8',
  );

  it('/api/products route reverse-proxies to Express backend without static catalog import', () => {
    assert.doesNotMatch(
      productsRouteSrc,
      /getFilteredProducts/,
      'apps/web/src/app/api/products/route.ts must not import getFilteredProducts from static catalog',
    );
    assert.match(
      productsRouteSrc,
      /fetch\(\s*targetUrl|\$\{API_BASE_URL\}\/products/,
      'apps/web/src/app/api/products/route.ts must fetch from Express backend API_BASE_URL/products',
    );
    assert.match(
      productsRouteSrc,
      /success:\s*true/,
      'apps/web/src/app/api/products/route.ts must return standardized success response envelope',
    );
  });

  it('/api/products/[slug] route reverse-proxies to Express backend and handles 404', () => {
    assert.doesNotMatch(
      productSlugRouteSrc,
      /getProductBySlug/,
      'apps/web/src/app/api/products/[slug]/route.ts must not import getProductBySlug from static catalog',
    );
    assert.match(
      productSlugRouteSrc,
      /fetch\(\s*targetUrl|\$\{API_BASE_URL\}\/products\//,
      'apps/web/src/app/api/products/[slug]/route.ts must fetch from Express backend',
    );
    assert.match(
      productSlugRouteSrc,
      /res\.status\s*===\s*404/,
      'apps/web/src/app/api/products/[slug]/route.ts must propagate 404 status when product not found',
    );
  });
});

describe('Batch 3: CRIT-02 - Catalog & PDP Real-Time Data Flow (No Zombie Persistence)', () => {
  const productsPageSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'products', 'page.tsx'),
    'utf-8',
  );
  const productSlugPageSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'products', '[slug]', 'page.tsx'),
    'utf-8',
  );

  it('products/page.tsx does not unconditionally concatenate CATALOG_PRODUCTS', () => {
    assert.doesNotMatch(
      productsPageSrc,
      /for\s*\(\s*const\s+p\s+of\s+CATALOG_PRODUCTS\s*\)\s*\{\s*if\s*\(!seenSlugs\.has\(p\.slug\)\)\s*merged\.push\(p\);?\s*\}/,
      'products/page.tsx must not merge unseen CATALOG_PRODUCTS onto API responses',
    );
    assert.match(
      productsPageSrc,
      /useState<CatalogProduct\[\]>\(\[\]\)/,
      'products/page.tsx must initialize catalog products from empty state pending stream loading',
    );
    assert.match(
      productsPageSrc,
      /NO MATCHING HARDWARE FOUND IN ARCHIVE/,
      'products/page.tsx must render clean empty state notice when no products are found',
    );
  });

  it('products/[slug]/page.tsx does not resurrect deleted/unpublished products from static catalog', () => {
    assert.match(
      productSlugPageSrc,
      /\.catch\(\(\)\s*=>\s*\{[\s\S]*?setIsNotFound\(true\);/,
      'products/[slug]/page.tsx must mark isNotFound=true on API error instead of silently using static fallback',
    );
    assert.match(
      productSlugPageSrc,
      /if\s*\(!product\)\s*\{\s*notFound\(\);\s*\}/,
      'products/[slug]/page.tsx must invoke Next.js notFound() when product is null',
    );
  });

  it('products/page.tsx displays total count of loaded database products rather than static catalog', () => {
    assert.match(
      productsPageSrc,
      /SHOWING\s*\{filteredProducts\.length\}\s*OF\s*\{catalogProducts\.length\}\s*PIECES/,
      'products/page.tsx must show catalogProducts.length in header counter',
    );
  });
});

describe('Batch 3: CRIT-06 - Support Ticket Model, Express Persistence & Contact Proxy', () => {
  const ticketModelPath = path.join(apiDir, 'src', 'models', 'Ticket.model.ts');
  const supportRoutesPath = path.join(apiDir, 'src', 'routes', 'support.routes.ts');
  const routesIndexPath = path.join(apiDir, 'src', 'routes', 'index.ts');
  const contactRoutePath = path.join(webDir, 'src', 'app', 'api', 'contact', 'route.ts');

  it('Ticket.model.ts exists and defines MongoDB ticket schema with timestamps and index', () => {
    assert.strictEqual(fs.existsSync(ticketModelPath), true, 'Ticket.model.ts must exist');
    const src = fs.readFileSync(ticketModelPath, 'utf-8');
    assert.match(src, /ticketId:\s*\{\s*type:\s*String,\s*required:\s*true,\s*unique:\s*true\s*\}/);
    assert.match(src, /email:\s*\{\s*type:\s*String,\s*required:\s*true/);
    assert.match(src, /message:\s*\{\s*type:\s*String,\s*required:\s*true/);
    assert.match(src, /status:\s*\{[\s\S]*?'open'[\s\S]*?'resolved'/);
    assert.match(src, /export const Ticket/);
  });

  it('support.routes.ts exists, validates payloads, creates Ticket and mounts on apiRouter', () => {
    assert.strictEqual(fs.existsSync(supportRoutesPath), true, 'support.routes.ts must exist');
    const supportSrc = fs.readFileSync(supportRoutesPath, 'utf-8');
    assert.match(supportSrc, /router\.post\('\/'/);
    assert.match(supportSrc, /Ticket\.create\(/);
    assert.match(supportSrc, /global_store_settings/);

    const indexSrc = fs.readFileSync(routesIndexPath, 'utf-8');
    assert.match(indexSrc, /import supportRoutes from '\.\/support\.routes'/);
    assert.match(indexSrc, /apiRouter\.use\('\/support',\s*supportRoutes\)/);
  });

  it('contact/route.ts proxies submissions to Express /support endpoint', () => {
    const contactSrc = fs.readFileSync(contactRoutePath, 'utf-8');
    assert.match(contactSrc, /\$\{API_BASE_URL\}\/support/);
    assert.match(contactSrc, /method:\s*'POST'/);
    assert.match(contactSrc, /ticketId:/);
  });
});

describe('Batch 3: CRIT-07 - Dynamic Variant Sizes & Stock Derivation', () => {
  const utilsSrc = fs.readFileSync(
    path.join(webDir, 'src', 'lib', 'utils.ts'),
    'utf-8',
  );
  const productSlugPageSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'products', '[slug]', 'page.tsx'),
    'utf-8',
  );

  it('utils.ts getAvailableSizes eliminates hardcoded VPT-VLT check and accepts variant specs', () => {
    assert.doesNotMatch(
      utilsSrc,
      /sku\?\.startsWith\('VPT-VLT'\)/,
      'utils.ts must not contain hardcoded VPT-VLT sku check',
    );
    assert.match(
      utilsSrc,
      /variants\?: Array<\{ size\?: string; stock\?: number; inStock\?: boolean \}>/,
      'utils.ts getAvailableSizes must accept variants array for dynamic stock calculation',
    );
  });

  it('PDP [slug]/page.tsx derives sizes and disabled state from dynamic variant stock', () => {
    assert.doesNotMatch(
      productSlugPageSrc,
      /activeVariant\.sku\.startsWith\('VPT-VLT'\)/,
      'PDP [slug]/page.tsx must not hardcode VPT-VLT check',
    );
    assert.match(
      productSlugPageSrc,
      /matchingVariant\.stock\s*<=\s*0/,
      'PDP [slug]/page.tsx isSizeDisabled must check matchingVariant.stock <= 0 dynamically',
    );
  });

  it('eliminates hardcoded XS-XXL size array from utils.ts and PDP', () => {
    assert.doesNotMatch(
      utilsSrc,
      /'XXL'/,
      'utils.ts must not contain hardcoded XXL size fallback',
    );
    assert.doesNotMatch(
      productSlugPageSrc,
      /'XXL'/,
      'PDP [slug]/page.tsx must not contain hardcoded XXL size fallback',
    );
  });

  it('BestsellerGrid and FeaturedCollection pass product.variants to getAvailableSizes', () => {
    const bestsellerSrc = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'store', 'BestsellerGrid.tsx'),
      'utf-8',
    );
    const featuredSrc = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'store', 'FeaturedCollection.tsx'),
      'utf-8',
    );
    assert.match(
      bestsellerSrc,
      /getAvailableSizes\(product\.category,\s*activeVariant\.sku,\s*product\.variants\)/,
      'BestsellerGrid must pass product.variants to getAvailableSizes',
    );
    assert.match(
      featuredSrc,
      /getAvailableSizes\(product\.category,\s*activeVariant\.sku,\s*product\.variants\)/,
      'FeaturedCollection must pass product.variants to getAvailableSizes',
    );
  });
});

describe('Batch 3: HIGH-04 - Wishlist Live Variant Resolution on Move-to-Bag', () => {
  const wishlistPageSrc = fs.readFileSync(
    path.join(webDir, 'src', 'app', 'wishlist', 'page.tsx'),
    'utf-8',
  );

  it('Wishlist page integrates with api client to resolve dynamic product details', () => {
    assert.match(
      wishlistPageSrc,
      /import\s*\{\s*api\s*\}\s*from\s*'@\/lib\/api'/,
      'wishlist/page.tsx must import api from @/lib/api',
    );
    assert.match(
      wishlistPageSrc,
      /handleMoveToBag\s*=\s*async/,
      'wishlist/page.tsx handleMoveToBag must be async to allow live fetching',
    );
    assert.match(
      wishlistPageSrc,
      /api\.get<\{[\s\S]*?\}\>\(\s*`\/products\/\$\{encodeURIComponent/,
      'wishlist/page.tsx must fetch live variant details if product not found in static catalog',
    );
  });

  it('Wishlist page dynamically resolves size options and assigns matching variant SKU', () => {
    assert.match(
      wishlistPageSrc,
      /matchingVariant\?\.sku/,
      'wishlist/page.tsx must assign matchingVariant.sku when adding to cart',
    );
    assert.match(
      wishlistPageSrc,
      /liveProd\?\.variants/,
      'wishlist/page.tsx must derive size options from liveProd.variants when available',
    );
  });
});
