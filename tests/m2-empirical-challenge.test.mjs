/**
 * M2 Empirical Adversarial Challenge: Product Catalog API Verification Suite
 * Authored by m2_challenger_1 (empirical_challenger)
 *
 * Objectives:
 * 1. Category aggregation route ordering & swallowing verification (GET /api/products/categories vs /:slug)
 * 2. Query filtering stress-testing with complex parameter combinations (category + search + minPrice + maxPrice + sort)
 * 3. Dual slug lookup and ObjectId lookup fallback resilience (with 404 handling)
 * 4. Catalog seed data fidelity & technical schema conformance
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import of compiled API modules
const prodRoutesModule = await import('../apps/api/dist/routes/products.routes.js');
const errHandlerModule = await import('../apps/api/dist/middleware/errorHandler.js');
const productModelModule = await import('../apps/api/dist/models/Product.model.js');

const productRouter = prodRoutesModule.default?.default || prodRoutesModule.default;
const errorHandler = errHandlerModule.errorHandler || errHandlerModule.default?.errorHandler;
const Product = productModelModule.Product || productModelModule.default?.Product;

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xydv';

describe('Milestone 2 Empirical Challenge: Product Catalog API & Route Resilience', () => {
  let app;
  let server;
  let baseUrl;
  let sampleProduct;
  let allProducts;

  before(async () => {
    // 1. Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // 2. Fetch sample product for slug and ObjectId tests
    allProducts = await Product.find({ isPublished: true }).lean();
    assert.ok(
      allProducts.length >= 10,
      `Database must contain at least 10 seeded products (found: ${allProducts.length})`,
    );
    sampleProduct = allProducts.find((p) => p.slug === 'volt-performance-tee') || allProducts[0];
    assert.ok(sampleProduct, 'Sample product must exist');

    // 3. Mount Express application with isolated port 0
    app = express();
    app.use(express.json());
    app.use('/api/products', productRouter);
    app.use(errorHandler);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/products`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ==========================================================================
  // SUITE 1: Route Precedence & Category Aggregation (GET /categories vs /:slug)
  // ==========================================================================
  describe('Suite 1: Category Aggregation Route Ordering & Swallowing Verification', () => {
    it('1.1: Express router layer stack declares /categories BEFORE /:slug', () => {
      assert.ok(productRouter.stack, 'Router must have an internal middleware stack');
      const routeLayers = productRouter.stack.filter((layer) => layer.route);

      const categoriesIndex = routeLayers.findIndex((l) => l.route.path === '/categories');
      const slugIndex = routeLayers.findIndex((l) => l.route.path === '/:slug');

      assert.ok(categoriesIndex !== -1, "Route '/categories' must be registered on router");
      assert.ok(slugIndex !== -1, "Route '/:slug' must be registered on router");
      assert.ok(
        categoriesIndex < slugIndex,
        `CRITICAL ORDERING: '/categories' (index ${categoriesIndex}) must precede '/:slug' (index ${slugIndex}) to prevent route shadowing`,
      );
    });

    it('1.2: Counterfactual simulation: if /:slug preceded /categories, /categories would be swallowed and return 404', async () => {
      // Create broken router where /:slug is mounted before /categories
      const brokenApp = express();
      const brokenRouter = express.Router();

      brokenRouter.get('/:slug', async (req, res, next) => {
        const slug = req.params.slug;
        const prod = await Product.findOne({ slug, isPublished: true });
        if (!prod) return next(new errHandlerModule.AppError(`Product not found: ${slug}`, 404));
        res.json({ success: true, data: prod });
      });

      brokenRouter.get('/categories', async (_req, res) => {
        res.json({ success: true, message: 'categories aggregated' });
      });

      brokenApp.use('/test', brokenRouter);
      brokenApp.use(errorHandler);

      let brokenPort;
      const brokenServer = await new Promise((resolve) => {
        const s = brokenApp.listen(0, '127.0.0.1', () => {
          brokenPort = s.address().port;
          resolve(s);
        });
      });

      try {
        const res = await fetch(`http://127.0.0.1:${brokenPort}/test/categories`);
        const body = await res.json();
        assert.equal(
          res.status,
          404,
          'Swallowed route returns 404 because "categories" is treated as :slug',
        );
        assert.match(body.error, /Product not found: categories/);
      } finally {
        await new Promise((r) => brokenServer.close(r));
      }
    });

    it('1.3: Real HTTP GET /api/products/categories returns HTTP 200 with all 4 tactical categories', async () => {
      const res = await fetch(`${baseUrl}/categories`);
      assert.equal(res.status, 200, 'GET /api/products/categories must return HTTP 200');

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data), 'Data must be an array');
      assert.equal(body.data.length, 4, 'Must return exactly 4 categories');

      const categorySlugs = body.data.map((c) => c.slug);
      assert.deepEqual(
        categorySlugs.sort(),
        ['accessories', 'bottoms', 'outerwear', 'tops'],
        'Must contain accessories, bottoms, outerwear, tops',
      );
    });

    it('1.4: Category aggregation computes valid counts, price bounds, and image assets', async () => {
      const res = await fetch(`${baseUrl}/categories`);
      const body = await res.json();

      let totalProductsInCategories = 0;
      for (const cat of body.data) {
        assert.ok(typeof cat.id === 'string' && cat.id.length > 0);
        assert.ok(typeof cat.name === 'string' && cat.name.length > 0);
        assert.ok(typeof cat.description === 'string' && cat.description.length > 0);
        assert.ok(
          typeof cat.count === 'number' && cat.count > 0,
          `Category ${cat.slug} must have count > 0`,
        );
        assert.ok(
          typeof cat.minPrice === 'number' && cat.minPrice > 0,
          `minPrice for ${cat.slug} must be > 0`,
        );
        assert.ok(
          typeof cat.maxPrice === 'number' && cat.maxPrice >= cat.minPrice,
          `maxPrice must be >= minPrice`,
        );
        assert.ok(
          typeof cat.imageUrl === 'string' && cat.imageUrl.startsWith('http'),
          `imageUrl for ${cat.slug} must be valid URL`,
        );
        totalProductsInCategories += cat.count;
      }

      assert.equal(
        totalProductsInCategories,
        10,
        'Sum of all category counts must equal total catalog size (10)',
      );
    });
  });

  // ==========================================================================
  // SUITE 2: Query Filtering Complex Combinations & Adversarial Boundaries
  // ==========================================================================
  describe('Suite 2: Query Filtering with Complex Combinations & Boundaries', () => {
    it('2.1: Multi-parameter intersection (category + search + minPrice + maxPrice + sort)', async () => {
      // tops ($58, $78, $185); search="compression" ($78); minPrice=50, maxPrice=100; sort=price-asc
      const res = await fetch(
        `${baseUrl}?category=tops&search=compression&minPrice=50&maxPrice=100&sort=price-asc`,
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.total, 1);
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].name, 'Seamless Engineered Compression Top');
      assert.equal(body.data[0].category, 'tops');
      assert.equal(body.data[0].price, 78);
    });

    it('2.2: Price bound filtering in category (category=bottoms&minPrice=100&sort=price-desc)', async () => {
      // bottoms: Cordura Cargo ($168), Hybrid Training Short ($88), Apex Shorts ($72)
      const res = await fetch(`${baseUrl}?category=bottoms&minPrice=100&sort=price-desc`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.total, 1);
      assert.equal(body.data[0].name, 'Cordura Modular Cargo Pant');
      assert.equal(body.data[0].price, 168);
    });

    it('2.3: Broad search + sort price-desc vs price-asc consistency', async () => {
      const resDesc = await fetch(`${baseUrl}?search=tactical&sort=price-desc`);
      const bodyDesc = await resDesc.json();
      assert.ok(bodyDesc.data.length >= 3, 'Search for "tactical" must return multiple products');

      // Verify descending price order
      for (let i = 0; i < bodyDesc.data.length - 1; i++) {
        assert.ok(
          bodyDesc.data[i].price >= bodyDesc.data[i + 1].price,
          `Desc sort order violated: ${bodyDesc.data[i].price} < ${bodyDesc.data[i + 1].price}`,
        );
      }

      const resAsc = await fetch(`${baseUrl}?search=tactical&sort=price-asc`);
      const bodyAsc = await resAsc.json();
      assert.equal(bodyAsc.data.length, bodyDesc.data.length);

      // Verify ascending price order
      for (let i = 0; i < bodyAsc.data.length - 1; i++) {
        assert.ok(
          bodyAsc.data[i].price <= bodyAsc.data[i + 1].price,
          `Asc sort order violated: ${bodyAsc.data[i].price} > ${bodyAsc.data[i + 1].price}`,
        );
      }
    });

    it('2.4: Category bypass: category=all returns full catalog without filter', async () => {
      const res = await fetch(`${baseUrl}?category=all`);
      const body = await res.json();
      assert.equal(body.total, 10);
      assert.equal(body.data.length, 10);
    });

    it('2.5: Case-insensitivity & whitespace trimming on category param', async () => {
      const res = await fetch(`${baseUrl}?category=%20%20TOPS%20%20`);
      const body = await res.json();
      assert.equal(body.total, 3);
      for (const prod of body.data) {
        assert.equal(prod.category, 'tops');
      }
    });

    it('2.6: Contradictory price bounds (minPrice > maxPrice) returns empty set gracefully', async () => {
      const res = await fetch(`${baseUrl}?minPrice=200&maxPrice=100`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.total, 0);
      assert.equal(body.data.length, 0);
    });

    it('2.7: Pagination slicing and metadata integrity', async () => {
      const resP1 = await fetch(`${baseUrl}?page=1&limit=3&sort=price-asc`);
      const bodyP1 = await resP1.json();
      assert.equal(bodyP1.page, 1);
      assert.equal(bodyP1.limit, 3);
      assert.equal(bodyP1.totalPages, 4);
      assert.equal(bodyP1.total, 10);
      assert.equal(bodyP1.data.length, 3);

      const resP2 = await fetch(`${baseUrl}?page=2&limit=3&sort=price-asc`);
      const bodyP2 = await resP2.json();
      assert.equal(bodyP2.page, 2);
      assert.equal(bodyP2.data.length, 3);

      // Verify page 1 and page 2 contain strictly non-overlapping products
      const p1Ids = new Set(bodyP1.data.map((p) => p._id));
      for (const p of bodyP2.data) {
        assert.ok(!p1Ids.has(p._id), `Product ${p._id} appeared on both page 1 and page 2`);
      }
    });

    it('2.8: Adversarial pagination boundary clamping (negative page & overflow limit)', async () => {
      const res = await fetch(`${baseUrl}?page=-50&limit=9999`);
      const body = await res.json();
      assert.equal(body.page, 1, 'Negative page must clamp to 1');
      assert.equal(body.limit, 100, 'Limit above 100 must clamp to 100');
    });

    it('2.9: Regex injection resilience in search param', async () => {
      // Regex special characters must be escaped so they do not crash or match everything
      const res1 = await fetch(`${baseUrl}?search=.*`);
      const body1 = await res1.json();
      assert.equal(res1.status, 200);
      // Literal ".*" does not exist in product names, so it should return 0, not 10
      assert.equal(body1.total, 0);

      const res2 = await fetch(`${baseUrl}?search=(unclosed[regex`);
      const body2 = await res2.json();
      assert.equal(res2.status, 200, 'Malformed regex must be escaped safely without 500 error');
      assert.equal(body2.total, 0);
    });

    it('2.10: Non-numeric price inputs are safely ignored without NaN errors', async () => {
      const res = await fetch(`${baseUrl}?minPrice=invalid_string&maxPrice=NaN`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(
        body.total,
        10,
        'Invalid price strings should be ignored rather than crashing query',
      );
    });

    it('2.11: Unknown sort fallback defaults to newest order', async () => {
      const res = await fetch(`${baseUrl}?sort=non_existent_sorting_scheme`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.total, 10);
      assert.equal(body.data.length, 10);
    });

    it('2.12: In-stock filtering correctly filters by stock availability', async () => {
      const resInStock = await fetch(`${baseUrl}?inStock=true`);
      const bodyInStock = await resInStock.json();
      assert.equal(resInStock.status, 200);
      for (const prod of bodyInStock.data) {
        assert.equal(prod.inStock, true);
      }

      const resOutOfStock = await fetch(`${baseUrl}?inStock=false`);
      const bodyOutOfStock = await resOutOfStock.json();
      assert.equal(resOutOfStock.status, 200);
      assert.equal(bodyOutOfStock.total, 0, 'Catalog seed has 100% in-stock products');
    });

    it('2.13: Featured and bestseller query flags return correct subsets', async () => {
      const resFeatured = await fetch(`${baseUrl}?featured=true`);
      const bodyFeatured = await resFeatured.json();
      assert.ok(bodyFeatured.total > 0, 'Catalog must contain featured items');
      for (const p of bodyFeatured.data) {
        assert.ok(p.isFeatured || p.featured, `Product ${p.name} must be featured`);
      }

      const resBestseller = await fetch(`${baseUrl}?bestseller=1`);
      const bodyBestseller = await resBestseller.json();
      assert.ok(bodyBestseller.total > 0, 'Catalog must contain bestseller items');
      for (const p of bodyBestseller.data) {
        assert.ok(p.bestseller || (p.tags && p.tags.includes('bestseller')));
      }
    });
  });

  // ==========================================================================
  // SUITE 3: Slug Lookup & ObjectId Fallback Resilience
  // ==========================================================================
  describe('Suite 3: Slug Lookup vs. ObjectId Fallback Resilience', () => {
    it('3.1: Valid slug lookup returns the exact product', async () => {
      const res = await fetch(`${baseUrl}/${sampleProduct.slug}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.slug, sampleProduct.slug);
      assert.equal(body.data.name, sampleProduct.name);
      assert.equal(body.data.price, sampleProduct.price);
    });

    it('3.2: Valid ObjectId lookup fallback returns the exact product', async () => {
      const objectIdStr = sampleProduct._id.toString();
      const res = await fetch(`${baseUrl}/${objectIdStr}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data._id.toString(), objectIdStr);
      assert.equal(body.data.slug, sampleProduct.slug);
      assert.equal(body.data.name, sampleProduct.name);
    });

    it('3.3: Product retrieved by slug and by ObjectId are identical in payload', async () => {
      const resSlug = await fetch(`${baseUrl}/${sampleProduct.slug}`);
      const resId = await fetch(`${baseUrl}/${sampleProduct._id}`);

      const bodySlug = await resSlug.json();
      const bodyId = await resId.json();

      assert.deepEqual(bodySlug.data._id, bodyId.data._id);
      assert.deepEqual(bodySlug.data.price, bodyId.data.price);
      assert.deepEqual(bodySlug.data.variants.length, bodyId.data.variants.length);
      assert.deepEqual(bodySlug.data.specs, bodyId.data.specs);
    });

    it('3.4: Non-existent slug returns HTTP 404 with standard error contract', async () => {
      const fakeSlug = 'definitely-non-existent-tactical-item-12345';
      const res = await fetch(`${baseUrl}/${fakeSlug}`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.error, new RegExp(`Product not found: ${fakeSlug}`));
    });

    it('3.5: Non-existent valid 24-hex ObjectId returns HTTP 404 without CastError or crash', async () => {
      const fakeObjectId = '507f1f77bcf86cd799439011';
      const res = await fetch(`${baseUrl}/${fakeObjectId}`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.error, new RegExp(`Product not found: ${fakeObjectId}`));
    });

    it('3.6: Special characters and spaces in slug param handle safely with 404', async () => {
      const weirdSlug = encodeURIComponent('tactical product with spaces!@#');
      const res = await fetch(`${baseUrl}/${weirdSlug}`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
    });
  });

  // ==========================================================================
  // SUITE 4: Seed Data Quality & Technical Schema Conformance
  // ==========================================================================
  describe('Suite 4: Catalog Seed Quality & Technical Specs Conformance', () => {
    it('4.1: Database contains exactly 10 products with correct Bento distribution', async () => {
      const categoryCounts = allProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {});

      assert.equal(categoryCounts.tops, 3, 'Tops must have 3 products for 16:10 Bento cell');
      assert.equal(categoryCounts.bottoms, 3, 'Bottoms must have 3 products for 3:4 Bento cell');
      assert.equal(
        categoryCounts.outerwear,
        2,
        'Outerwear must have 2 products for 16:9 Bento cell',
      );
      assert.equal(
        categoryCounts.accessories,
        2,
        'Accessories must have 2 products for 1:1 Bento cell',
      );
      assert.equal(allProducts.length, 10, 'Total must equal 10 for full-width Bento cell');
    });

    it('4.2: 100% of products provide variants across all 4 tactical colorways', () => {
      const tacticalColors = ['#0A0A0A', '#1F1F1F', '#2A2F2B', '#E8FF00'];
      for (const prod of allProducts) {
        assert.ok(prod.variants.length >= 4, `Product ${prod.name} must have at least 4 variants`);
        const variantColors = prod.variants.map((v) => v.colorHex.toUpperCase());
        for (const color of tacticalColors) {
          assert.ok(
            variantColors.includes(color),
            `Product ${prod.name} is missing tactical colorway ${color}`,
          );
        }
      }
    });

    it('4.3: 100% of variants provide both imageUrl and secondaryImageUrl for crossfade', () => {
      for (const prod of allProducts) {
        for (const variant of prod.variants) {
          assert.ok(
            typeof variant.imageUrl === 'string' && variant.imageUrl.startsWith('http'),
            `Variant ${variant.sku} missing primary imageUrl`,
          );
          assert.ok(
            typeof variant.secondaryImageUrl === 'string' &&
              variant.secondaryImageUrl.startsWith('http'),
            `Variant ${variant.sku} missing secondaryImageUrl for hover crossfade`,
          );
        }
      }
    });

    it('4.4: 100% of products include technical specs citing high-performance fabrics', () => {
      const technicalFabrics = [
        'Cordura',
        'GORE-TEX',
        'YKK',
        'DWR',
        'Ripstop',
        'Merino',
        'Fidlock',
        '4-Way',
      ];
      for (const prod of allProducts) {
        assert.ok(
          Array.isArray(prod.specs) && prod.specs.length > 0,
          `Product ${prod.name} must have specs`,
        );
        const allSpecsText = prod.specs.map((s) => `${s.label} ${s.value}`).join(' ');
        const hasTechnicalCitation = technicalFabrics.some((fab) =>
          allSpecsText.toLowerCase().includes(fab.toLowerCase()),
        );
        assert.ok(
          hasTechnicalCitation,
          `Product ${prod.name} specs must cite technical fabric/hardware (${allSpecsText})`,
        );
      }
    });

    it('4.5: Anchor products from CATALOG_FIXTURES retain their expected prices', () => {
      const expectedAnchors = [
        { name: 'Volt Performance Tee', price: 58, category: 'tops' },
        { name: 'Apex Modular Training Shorts', price: 72, category: 'bottoms' },
        { name: 'Stealth Tactical Tech Hoodie', price: 148, category: 'outerwear' },
        { name: 'Modular Tactical Cap', price: 38, category: 'accessories' },
      ];

      for (const expected of expectedAnchors) {
        const found = allProducts.find((p) => p.name === expected.name);
        assert.ok(found, `Anchor product ${expected.name} must exist in seed`);
        assert.equal(found.price, expected.price);
        assert.equal(found.category, expected.category);
      }
    });
  });
});
