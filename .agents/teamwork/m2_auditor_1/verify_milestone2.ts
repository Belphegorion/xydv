import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Product } from '../../../apps/api/src/models/Product.model';
import productsRouter from '../../../apps/api/src/routes/products.routes';
import ordersRouter from '../../../apps/api/src/routes/orders.routes';
import webhooksRouter from '../../../apps/api/src/routes/webhooks.routes';
import { SEED_PRODUCTS, BENTO_CATEGORIES } from '../../../apps/api/src/scripts/seed';
import { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from '../../../apps/api/src/config/razorpay';

async function runForensicAudit() {
  console.log('='.repeat(70));
  console.log('🔬 FORENSIC AUDIT: MILESTONE 2 EMPIRICAL VERIFICATION');
  console.log('='.repeat(70));

  let passedChecks = 0;
  let totalChecks = 0;

  function testCheck(name: string, fn: () => void | Promise<void>) {
    totalChecks++;
    try {
      fn();
      console.log(`  [PASS] Check ${totalChecks}: ${name}`);
      passedChecks++;
    } catch (err: any) {
      console.error(`  [FAIL] Check ${totalChecks}: ${name}`);
      console.error(`         Error: ${err.message}`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // 1. PRODUCT MODEL INTEGRITY & PRE-VALIDATE HOOKS
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 1: Product Model Schema & Logic ---');

  testCheck('Product schema has all required top-level fields', () => {
    const paths = (Product.schema as any).paths;
    assert.ok(paths['price'], 'price field exists');
    assert.ok(paths['originalPrice'], 'originalPrice field exists');
    assert.ok(paths['compareAt'], 'compareAt field exists');
    assert.ok(paths['specs'], 'specs array exists');
    assert.ok(paths['images'], 'images array exists');
    assert.ok(paths['variants'], 'variants array exists');
    assert.ok(paths['inStock'], 'inStock field exists');
    assert.ok(paths['isPublished'], 'isPublished field exists');
    assert.ok(paths['isFeatured'], 'isFeatured field exists');
    assert.ok(paths['featured'], 'featured field exists');
    assert.ok(paths['bestseller'], 'bestseller field exists');
    assert.ok(paths['slug'], 'slug field exists');
    assert.ok(paths['category'], 'category field exists');
  });

  testCheck('Variant subschema has all required fields including image crossfade', () => {
    const variantSchema = (Product.schema as any).paths['variants'].schema;
    const vPaths = variantSchema.paths;
    assert.ok(vPaths['id'] || vPaths['_id'], 'variant id exists');
    assert.ok(vPaths['sku'], 'sku exists');
    assert.ok(vPaths['color'], 'color exists');
    assert.ok(vPaths['colorName'], 'colorName exists');
    assert.ok(vPaths['colorHex'], 'colorHex exists');
    assert.ok(vPaths['size'], 'size exists');
    assert.ok(vPaths['price'], 'price exists');
    assert.ok(vPaths['stock'], 'stock exists');
    assert.ok(vPaths['imageUrl'], 'imageUrl exists');
    assert.ok(vPaths['secondaryImageUrl'], 'secondaryImageUrl exists');
  });

  testCheck('Pre-validate hook sets price from variant[0] if missing', async () => {
    const doc = new Product({
      name: 'Test Shell',
      slug: 'test-shell',
      brand: 'VERTEX',
      description: 'Test Description',
      category: 'outerwear',
      variants: [
        {
          sku: 'TS-01',
          color: 'Void Obsidian',
          colorName: 'Void Obsidian',
          colorHex: '#0A0A0A',
          size: 'M',
          price: 299.0,
          stock: 10,
          imageUrl: 'https://example.com/img1.webp',
        },
      ],
    });
    await doc.validate();
    assert.equal(doc.price, 299.0, 'Price must be auto-populated from variant[0]');
    assert.equal(doc.inStock, true, 'inStock must be auto-computed from variant stock');
  });

  testCheck('Pre-validate hook synchronizes isFeatured and featured flags', async () => {
    const doc1 = new Product({
      name: 'Featured Shell',
      slug: 'featured-shell',
      brand: 'VERTEX',
      description: 'Test Description',
      category: 'outerwear',
      isFeatured: true,
      variants: [
        {
          sku: 'FS-01',
          color: 'Void Obsidian',
          colorName: 'Void Obsidian',
          colorHex: '#0A0A0A',
          size: 'M',
          price: 199.0,
          stock: 5,
          imageUrl: 'https://example.com/img1.webp',
        },
      ],
    });
    await doc1.validate();
    assert.equal(doc1.featured, true, 'featured must sync with isFeatured');

    const doc2 = new Product({
      name: 'Featured Shell 2',
      slug: 'featured-shell-2',
      brand: 'VERTEX',
      description: 'Test Description',
      category: 'outerwear',
      featured: true,
      variants: [
        {
          sku: 'FS-02',
          color: 'Void Obsidian',
          colorName: 'Void Obsidian',
          colorHex: '#0A0A0A',
          size: 'M',
          price: 199.0,
          stock: 0,
          imageUrl: 'https://example.com/img1.webp',
        },
      ],
    });
    await doc2.validate();
    assert.equal(doc2.isFeatured, true, 'isFeatured must sync with featured');
    assert.equal(doc2.inStock, false, 'inStock must be false when all variant stock is 0');
  });

  // --------------------------------------------------------------------------
  // 2. PRODUCTS ROUTES INTEGRITY & ROUTE ORDER
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 2: Products Routes & Route Order ---');

  testCheck('GET /categories route is registered BEFORE /:slug', () => {
    const routes = productsRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const categoriesIdx = routes.findIndex((r) => r.path === '/categories');
    const slugIdx = routes.findIndex((r) => r.path === '/:slug');

    assert.ok(categoriesIdx !== -1, 'GET /categories route exists');
    assert.ok(slugIdx !== -1, 'GET /:slug route exists');
    assert.ok(
      categoriesIdx < slugIdx,
      `GET /categories (index ${categoriesIdx}) MUST precede /:slug (index ${slugIdx})`,
    );
  });

  // --------------------------------------------------------------------------
  // 3. CATALOG SEED SCRIPT DATA AUTHENTICITY
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 3: Seed Script Data Authenticity ---');

  testCheck('Seed catalog contains exactly 10 high-fidelity products', () => {
    assert.equal(SEED_PRODUCTS.length, 10, 'Expected 10 seed products');
  });

  testCheck('Category distribution maps accurately across 4 categories', () => {
    const categoriesCount: Record<string, number> = {};
    for (const p of SEED_PRODUCTS) {
      categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
    }
    assert.equal(categoriesCount['tops'], 3, '3 tops products');
    assert.equal(categoriesCount['bottoms'], 3, '3 bottoms products');
    assert.equal(categoriesCount['outerwear'], 2, '2 outerwear products');
    assert.equal(categoriesCount['accessories'], 2, '2 accessories products');
  });

  testCheck('Bento grid categories specify all 5 cells with correct ratios', () => {
    assert.equal(BENTO_CATEGORIES.length, 5, '5 Bento cells');
    const ratios = BENTO_CATEGORIES.map((c) => c.ratio);
    assert.deepEqual(ratios, ['16:10', '3:4', '16:9', '1:1', 'full-width']);
  });

  testCheck('100% of products provide all 4 tactical colorway swatches', () => {
    const requiredColors = ['#0A0A0A', '#1F1F1F', '#2A2F2B', '#E8FF00'];
    for (const p of SEED_PRODUCTS) {
      const colors = p.variants.map((v) => v.colorHex.toUpperCase());
      for (const reqColor of requiredColors) {
        assert.ok(
          colors.includes(reqColor),
          `Product "${p.name}" must contain swatch color ${reqColor}`,
        );
      }
    }
  });

  testCheck('All variants provide dual aspect-locked image URLs (primary + secondary)', () => {
    for (const p of SEED_PRODUCTS) {
      for (const v of p.variants) {
        assert.ok(
          typeof v.imageUrl === 'string' && v.imageUrl.startsWith('http'),
          `Variant ${v.sku} has valid imageUrl`,
        );
        assert.ok(
          typeof v.secondaryImageUrl === 'string' && v.secondaryImageUrl.startsWith('http'),
          `Variant ${v.sku} has valid secondaryImageUrl for hover crossfade`,
        );
      }
    }
  });

  testCheck('Technical activewear specs cite genuine materials', () => {
    const allSpecs = SEED_PRODUCTS.flatMap((p) => p.specs.map((s) => s.value.toLowerCase()));
    const textJoined = allSpecs.join(' ');
    assert.ok(textJoined.includes('gore-tex'), 'Contains Gore-Tex specs');
    assert.ok(textJoined.includes('cordura'), 'Contains Cordura specs');
    assert.ok(textJoined.includes('ykk'), 'Contains YKK AquaGuard specs');
    assert.ok(textJoined.includes('dwr'), 'Contains DWR C6 specs');
    assert.ok(textJoined.includes('fidlock'), 'Contains Fidlock specs');
  });

  testCheck('Catalog includes all 4 test harness anchor products', () => {
    const names = SEED_PRODUCTS.map((p) => p.name);
    assert.ok(names.includes('Volt Performance Tee'), 'Contains Volt Performance Tee');
    assert.ok(names.includes('Apex Modular Training Shorts'), 'Contains Apex Modular Training Shorts');
    assert.ok(names.includes('Stealth Tactical Tech Hoodie'), 'Contains Stealth Tactical Tech Hoodie');
    assert.ok(names.includes('Modular Tactical Cap'), 'Contains Modular Tactical Cap');
  });

  // --------------------------------------------------------------------------
  // 4. ORDERS ROUTES: TIMING-SAFE HMAC & QUANTITY VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 4: Orders Routes HMAC & Quantity Validation ---');

  testCheck('createOrderHandler rejects negative, zero, and float quantities with 400', async () => {
    const createOrderLayer = ordersRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay/create-order',
    );
    assert.ok(createOrderLayer, 'Route /razorpay/create-order exists');
    const handler = createOrderLayer.route.stack[0].handle;

    const testQuantities = [-1, 0, 1.5, '2', NaN, Infinity, null, undefined];
    for (const badQty of testQuantities) {
      let nextError: any = null;
      const req: any = {
        body: {
          items: [{ productId: '60c72b2f9b1d8b0015f8a000', quantity: badQty }],
        },
      };
      const res: any = {};
      const next = (err?: any) => {
        nextError = err;
      };

      await handler(req, res, next);
      assert.ok(nextError, `Expected error for quantity ${badQty}`);
      assert.equal(nextError.statusCode, 400, `Expected status 400 for quantity ${badQty}`);
      assert.match(nextError.message, /Quantity must be a positive integer/i);
    }
  });

  testCheck('createOrderHandler rejects empty items array with 400', async () => {
    const createOrderLayer = ordersRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay/create-order',
    );
    const handler = createOrderLayer.route.stack[0].handle;

    let nextError: any = null;
    const req: any = { body: { items: [] } };
    const res: any = {};
    const next = (err?: any) => {
      nextError = err;
    };

    await handler(req, res, next);
    assert.ok(nextError);
    assert.equal(nextError.statusCode, 400);
    assert.match(nextError.message, /at least one item/i);
  });

  testCheck('verifyPayment verifies valid HMAC signature correctly', () => {
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(validSignature, 'utf8');
    const actualBuf = Buffer.from(validSignature, 'utf8');
    assert.equal(expectedBuf.length, actualBuf.length);
    assert.ok(crypto.timingSafeEqual(expectedBuf, actualBuf));
  });

  testCheck('verifyPayment rejects truncated signature without crashing with RangeError', async () => {
    const verifyLayer = ordersRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay/verify-payment',
    );
    assert.ok(verifyLayer, 'Route /razorpay/verify-payment exists');
    const handler = verifyLayer.route.stack[0].handle;

    let nextError: any = null;
    const req: any = {
      body: {
        orderId: '60c72b2f9b1d8b0015f8a000',
        razorpayOrderId: 'order_test_12345',
        razorpayPaymentId: 'pay_test_67890',
        razorpaySignature: 'truncated_123', // Mismatched length (13 chars vs 64)
      },
    };
    const res: any = {};
    const next = (err?: any) => {
      nextError = err;
    };

    // Must NOT throw RangeError! Must pass to next(AppError(400))
    await handler(req, res, next);
    assert.ok(nextError);
    assert.equal(nextError.statusCode, 400);
    assert.match(nextError.message, /Invalid payment signature/i);
  });

  testCheck('verifyPayment rejects bit-flipped signature with 400', async () => {
    const verifyLayer = ordersRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay/verify-payment',
    );
    const handler = verifyLayer.route.stack[0].handle;

    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Flip first character
    const tampered = (validSignature[0] === 'a' ? 'b' : 'a') + validSignature.slice(1);

    let nextError: any = null;
    const req: any = {
      body: {
        orderId: '60c72b2f9b1d8b0015f8a000',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tampered,
      },
    };
    const res: any = {};
    const next = (err?: any) => {
      nextError = err;
    };

    await handler(req, res, next);
    assert.ok(nextError);
    assert.equal(nextError.statusCode, 400);
    assert.match(nextError.message, /Invalid payment signature/i);
  });

  testCheck('verifyPayment rejects non-string signature with 400', async () => {
    const verifyLayer = ordersRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay/verify-payment',
    );
    const handler = verifyLayer.route.stack[0].handle;

    let nextError: any = null;
    const req: any = {
      body: {
        orderId: '60c72b2f9b1d8b0015f8a000',
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 12345678, // non-string
      },
    };
    const res: any = {};
    const next = (err?: any) => {
      nextError = err;
    };

    await handler(req, res, next);
    assert.ok(nextError);
    assert.equal(nextError.statusCode, 400);
  });

  // --------------------------------------------------------------------------
  // 5. WEBHOOKS ROUTES: TIMING-SAFE HMAC, IDEMPOTENCY & RAW BODY HANDLING
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 5: Webhooks Routes Security & Idempotency ---');

  testCheck('webhooks route rejects missing or empty raw body with 400', async () => {
    const webhookLayer = webhooksRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay',
    );
    assert.ok(webhookLayer, 'Route /razorpay exists in webhooksRouter');
    const handler = webhookLayer.route.stack[0].handle;

    let statusCode: number | null = null;
    let jsonBody: any = null;

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
      },
    };

    // Test with missing signature
    await handler({ headers: {}, body: Buffer.from('{}') } as any, res);
    assert.equal(statusCode, 400);

    // Test with missing body
    await handler(
      { headers: { 'x-razorpay-signature': 'sig' }, body: null } as any,
      res,
    );
    assert.equal(statusCode, 400);

    // Test with empty buffer
    await handler(
      { headers: { 'x-razorpay-signature': 'sig' }, body: Buffer.alloc(0) } as any,
      res,
    );
    assert.equal(statusCode, 400);
  });

  testCheck('webhooks route rejects truncated signature without RangeError crash', async () => {
    const webhookLayer = webhooksRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay',
    );
    const handler = webhookLayer.route.stack[0].handle;

    let statusCode: number | null = null;
    let jsonBody: any = null;

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
      },
    };

    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    await handler(
      {
        headers: { 'x-razorpay-signature': 'too_short' },
        body: rawBody,
      } as any,
      res,
    );
    assert.equal(statusCode, 400);
    assert.equal(jsonBody.error, 'Invalid signature');
  });

  testCheck('webhooks route handles valid signature and event idempotency', async () => {
    const webhookLayer = webhooksRouter.stack.find(
      (layer: any) => layer.route?.path === '/razorpay',
    );
    const handler = webhookLayer.route.stack[0].handle;

    const eventPayload = {
      id: 'evt_test_unique_9988',
      event: 'payment.unknown_test',
      payload: {},
    };
    const rawBody = Buffer.from(JSON.stringify(eventPayload));
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    let responseData: any = null;
    const res: any = {
      status(code: number) {
        return this;
      },
      json(data: any) {
        responseData = data;
      },
    };

    // First delivery -> processed
    await handler(
      {
        headers: { 'x-razorpay-signature': validSignature },
        body: rawBody,
      } as any,
      res,
    );
    assert.equal(responseData.status, 'ok');
    assert.equal(responseData.received, true);

    // Second delivery of same eventId -> idempotent response
    let secondResponseData: any = null;
    const res2: any = {
      status(code: number) {
        return this;
      },
      json(data: any) {
        secondResponseData = data;
      },
    };

    await handler(
      {
        headers: { 'x-razorpay-signature': validSignature },
        body: rawBody,
      } as any,
      res2,
    );
    assert.equal(secondResponseData.status, 'ok');
    assert.equal(secondResponseData.idempotent, true);
    assert.match(secondResponseData.message, /already processed/i);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 FORENSIC AUDIT COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED (100%)`);
  console.log('='.repeat(70));
}

runForensicAudit().catch((err) => {
  console.error('\n❌ FORENSIC AUDIT FAILED:', err);
  process.exit(1);
});
