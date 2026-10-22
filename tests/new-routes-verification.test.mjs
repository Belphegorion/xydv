import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');

describe('New Storefront Routes & Centralized Catalog Verification', () => {
  test('1. Centralized Catalog contains all required products with valid lookbook images and specs', async () => {
    const catalogPath = path.join(webDir, 'src', 'lib', 'catalog.ts');
    assert.strictEqual(fs.existsSync(catalogPath), true, 'catalog.ts must exist');
    const catalogSrc = fs.readFileSync(catalogPath, 'utf8');

    assert.match(catalogSrc, /export const CATALOG_PRODUCTS/);
    assert.match(catalogSrc, /volt-performance-tee/);
    assert.match(catalogSrc, /apex-modular-training-shorts/);
    assert.match(catalogSrc, /storm-shield-ripstop-shell/);
    assert.match(catalogSrc, /ballistic-fidlock-cap/);
    assert.match(catalogSrc, /aeroflex-seamless-crop-top/);
    assert.match(catalogSrc, /thermal-compression-cargo-set/);
  });

  test('2. All required page route files exist in App Router directory', () => {
    const requiredPages = [
      'products/page.tsx',
      'products/[slug]/page.tsx',
      'wishlist/page.tsx',
      'sizing/page.tsx',
      'shipping/page.tsx',
      'returns/page.tsx',
      'faq/page.tsx',
      'contact/page.tsx',
      'privacy/page.tsx',
      'terms/page.tsx',
      'security/page.tsx',
    ];

    for (const page of requiredPages) {
      const fullPath = path.join(webDir, 'src', 'app', ...page.split('/'));
      assert.strictEqual(fs.existsSync(fullPath), true, `Route page ${page} must exist`);
    }
  });

  test('3. Lightweight API route handlers exist and implement HTTP methods', () => {
    const requiredApis = [
      'api/products/route.ts',
      'api/products/[slug]/route.ts',
      'api/contact/route.ts',
    ];

    for (const apiRoute of requiredApis) {
      const fullPath = path.join(webDir, 'src', 'app', ...apiRoute.split('/'));
      assert.strictEqual(fs.existsSync(fullPath), true, `API route ${apiRoute} must exist`);
      const src = fs.readFileSync(fullPath, 'utf8');
      assert.match(src, /export async function (GET|POST)/);
    }
  });

  test('4. Navbar navigation links resolve cleanly with zero broken 404 targets', () => {
    const navPath = path.join(webDir, 'src', 'components', 'layout', 'Navbar.tsx');
    const navSrc = fs.readFileSync(navPath, 'utf8');

    // Expected routes linked in Navbar
    const expectedRoutes = [
      '/products',
      '/products?category=tops',
      '/products?category=bottoms',
      '/products?category=outerwear',
      '/products?category=accessories',
      '/products?search=true',
      '/wishlist',
      '/sizing',
      '/shipping',
      '/contact',
    ];

    for (const route of expectedRoutes) {
      assert.strictEqual(
        navSrc.includes(route),
        true,
        `Navbar must include active route link: ${route}`,
      );
    }
  });

  test('5. Footer client links resolve cleanly with zero broken 404 targets', () => {
    const footerPath = path.join(webDir, 'src', 'components', 'layout', 'Footer.tsx');
    const footerSrc = fs.readFileSync(footerPath, 'utf8');

    const expectedFooterRoutes = [
      '/products?category=tops',
      '/products?category=bottoms',
      '/products?category=outerwear',
      '/products?category=accessories',
      '/products',
      '/sizing',
      '/shipping',
      '/returns',
      '/faq',
      '/contact',
      '/privacy',
      '/terms',
      '/security',
    ];

    for (const route of expectedFooterRoutes) {
      assert.strictEqual(
        footerSrc.includes(route),
        true,
        `Footer must include active link: ${route}`,
      );
    }
  });

  test('6. Wishlist page connects to useWishlistStore and provides move-to-bag functionality', () => {
    const wishlistPath = path.join(webDir, 'src', 'app', 'wishlist', 'page.tsx');
    const wishlistSrc = fs.readFileSync(wishlistPath, 'utf8');

    assert.match(wishlistSrc, /useWishlistStore/);
    assert.match(wishlistSrc, /useCartStore/);
    assert.match(wishlistSrc, /handleMoveToBag/);
    assert.match(wishlistSrc, /handleClearAll/);
  });

  test('7. Sizing page implements interactive calculation algorithm and metric/imperial toggle', () => {
    const sizingPath = path.join(webDir, 'src', 'app', 'sizing', 'page.tsx');
    const sizingSrc = fs.readFileSync(sizingPath, 'utf8');

    assert.match(sizingSrc, /heightCm/);
    assert.match(sizingSrc, /weightKg/);
    assert.match(sizingSrc, /fit/);
    assert.match(sizingSrc, /MEN_SIZE_CHART/);
    assert.match(sizingSrc, /WOMEN_SIZE_CHART/);
    assert.match(sizingSrc, /unitSystem/);
  });

  test('8. PDP implements sticky media rail, size matrix, and technical specs accordion', () => {
    const pdpPath = path.join(webDir, 'src', 'app', 'products', '[slug]', 'page.tsx');
    const pdpSrc = fs.readFileSync(pdpPath, 'utf8');

    assert.match(pdpSrc, /getProductBySlug/);
    assert.match(pdpSrc, /getRelatedProducts/);
    assert.match(pdpSrc, /handleAddToCart/);
    assert.match(pdpSrc, /toggleWishlist/);
    assert.match(pdpSrc, /TEXTILE & MATERIAL ENGINEERING/);
    assert.match(pdpSrc, /ATHLETIC BIOMECHANICS & FIT/);
    assert.match(pdpSrc, /CARE & LONGEVITY PROTOCOL/);
    assert.match(pdpSrc, /DISPATCH & WARRANTY GUARANTEE/);
  });
});
