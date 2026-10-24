import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('PriceDisplay & Storefront Promotional Discount Integration Tests', () => {
  const priceDisplayPath = path.join(ROOT, 'apps/web/src/components/ui/PriceDisplay.tsx');
  const featuredCollectionPath = path.join(ROOT, 'apps/web/src/components/store/FeaturedCollection.tsx');
  const bestsellerGridPath = path.join(ROOT, 'apps/web/src/components/store/BestsellerGrid.tsx');
  const catalogPagePath = path.join(ROOT, 'apps/web/src/app/products/page.tsx');
  const pdpPagePath = path.join(ROOT, 'apps/web/src/app/products/[slug]/page.tsx');
  const cartDrawerPath = path.join(ROOT, 'apps/web/src/components/store/CartDrawer.tsx');
  const catalogLibPath = path.join(ROOT, 'apps/web/src/lib/catalog.ts');
  const cartStorePath = path.join(ROOT, 'apps/web/src/store/cart.ts');

  test('1. PriceDisplay component implements accessible WCAG AAA markup with <del>, <ins>, and .sr-only', () => {
    assert.ok(fs.existsSync(priceDisplayPath), 'PriceDisplay.tsx must exist');
    const content = fs.readFileSync(priceDisplayPath, 'utf8');

    assert.ok(content.includes('<del'), 'PriceDisplay must use <del> for strikethrough original price');
    assert.ok(content.includes('<ins'), 'PriceDisplay must use <ins> for discounted current price');
    assert.ok(content.includes('sr-only'), 'PriceDisplay must provide sr-only announcement spans');
    assert.ok(content.includes('Original price:'), 'PriceDisplay must announce "Original price:" to screen readers');
    assert.ok(content.includes('Discounted price:'), 'PriceDisplay must announce "Discounted price:" to screen readers');
    assert.ok(content.includes('badgeLabel'), 'PriceDisplay must support custom promotional badgeLabel');
    assert.ok(content.includes('showSavings'), 'PriceDisplay must support showSavings text');
  });

  test('2. FeaturedCollection integrates PriceDisplay and passes promotional prices to cart', () => {
    assert.ok(fs.existsSync(featuredCollectionPath), 'FeaturedCollection.tsx must exist');
    const content = fs.readFileSync(featuredCollectionPath, 'utf8');

    assert.ok(content.includes('PriceDisplay'), 'FeaturedCollection must import PriceDisplay');
    assert.ok(content.includes('<PriceDisplay'), 'FeaturedCollection must render <PriceDisplay');
    assert.ok(content.includes('effectivePrice'), 'FeaturedCollection must map and handle effectivePrice');
    assert.ok(content.includes('regularPrice: product.price'), 'FeaturedCollection must pass regularPrice to cart');
  });

  test('3. BestsellerGrid integrates PriceDisplay and passes promotional prices to cart', () => {
    assert.ok(fs.existsSync(bestsellerGridPath), 'BestsellerGrid.tsx must exist');
    const content = fs.readFileSync(bestsellerGridPath, 'utf8');

    assert.ok(content.includes('PriceDisplay'), 'BestsellerGrid must import PriceDisplay');
    assert.ok(content.includes('<PriceDisplay'), 'BestsellerGrid must render <PriceDisplay');
    assert.ok(content.includes('effectivePrice'), 'BestsellerGrid must map and handle effectivePrice');
    assert.ok(content.includes('regularPrice: product.price'), 'BestsellerGrid must pass regularPrice to cart');
  });

  test('4. Catalog listing page (products/page.tsx) integrates PriceDisplay and sorts by effective price', () => {
    assert.ok(fs.existsSync(catalogPagePath), 'products/page.tsx must exist');
    const content = fs.readFileSync(catalogPagePath, 'utf8');

    assert.ok(content.includes('PriceDisplay'), 'products/page.tsx must import PriceDisplay');
    assert.ok(content.includes('<PriceDisplay'), 'products/page.tsx must render <PriceDisplay in CatalogCard');
    assert.ok(content.includes('effectivePricePaise'), 'products/page.tsx must preserve effectivePricePaise');
    assert.ok(content.includes('price-asc'), 'products/page.tsx must sort price-asc using effective price');
    assert.ok(content.includes('price-desc'), 'products/page.tsx must sort price-desc using effective price');
  });

  test('5. Product Detail Page (products/[slug]/page.tsx) renders prominent PriceDisplay with savings and statutory tax notice', () => {
    assert.ok(fs.existsSync(pdpPagePath), 'products/[slug]/page.tsx must exist');
    const content = fs.readFileSync(pdpPagePath, 'utf8');

    assert.ok(content.includes('PriceDisplay'), 'PDP must import PriceDisplay');
    assert.ok(content.includes('<PriceDisplay'), 'PDP must render <PriceDisplay');
    assert.ok(content.includes('showSavings={true}'), 'PDP must enable showSavings on PriceDisplay');
    assert.ok(content.includes('MRP inclusive of all taxes'), 'PDP must render statutory tax disclosure');
    assert.ok(content.includes('regularPrice: product.price'), 'PDP handleAddToCart must pass regularPrice to cart');
  });

  test('6. CartDrawer line items render PriceDisplay with struck-through regular price and discount badge', () => {
    assert.ok(fs.existsSync(cartDrawerPath), 'CartDrawer.tsx must exist');
    const content = fs.readFileSync(cartDrawerPath, 'utf8');

    assert.ok(content.includes('PriceDisplay'), 'CartDrawer must import PriceDisplay');
    assert.ok(content.includes('<PriceDisplay'), 'CartDrawer must render <PriceDisplay for line items');
    assert.ok(content.includes('regularPrice={item.regularPrice}'), 'CartDrawer must pass item.regularPrice to PriceDisplay');
    assert.ok(content.includes('mrp={item.compareAt}'), 'CartDrawer must pass item.compareAt to PriceDisplay');
  });

  test('7. Shared models (catalog.ts and cart.ts) type definitions support promotional discount fields', () => {
    const catalogContent = fs.readFileSync(catalogLibPath, 'utf8');
    const cartContent = fs.readFileSync(cartStorePath, 'utf8');

    assert.ok(catalogContent.includes('effectivePricePaise?: number;'), 'catalog.ts must type effectivePricePaise');
    assert.ok(catalogContent.includes('discountBadgeLabel?: string;'), 'catalog.ts must type discountBadgeLabel');
    assert.ok(cartContent.includes('regularPrice?: number;'), 'cart.ts CartItem must type regularPrice');
    assert.ok(cartContent.includes('discountBadgeLabel?: string;'), 'cart.ts CartItem must type discountBadgeLabel');
  });
});
