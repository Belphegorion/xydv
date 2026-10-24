import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xydv';

async function measureLatency(endpoint, options = {}, iterations = 20) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}${endpoint}`, options);
      await res.text();
      times.push(performance.now() - start);
    } catch (e) {
      times.push(9999);
    }
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  return {
    endpoint,
    iterations,
    min: Math.round(times[0] * 10) / 10,
    p50: Math.round(p50 * 10) / 10,
    p95: Math.round(p95 * 10) / 10,
    p99: Math.round(p99 * 10) / 10,
    max: Math.round(times[times.length - 1] * 10) / 10
  };
}

async function auditBackend() {
  console.log('Starting comprehensive Backend Audit & Query Plan Profiling...');

  const results = {
    testedAt: new Date().toISOString(),
    latencies: [],
    queryPlans: [],
    routeSecurityMatrix: [],
    concurrencyResults: {}
  };

  // 1. Measure Latencies on Critical Endpoints
  console.log('Measuring endpoint latency percentiles (p50, p95, p99)...');
  const endpointsToBenchmark = [
    '/health',
    '/products',
    '/products?category=qa-xydv-tactical-activewear',
    '/products?search=tactical',
    '/products/qa-xydv-tactical-stealth-jacket',
    '/categories',
    '/settings',
    '/notifications'
  ];

  for (const ep of endpointsToBenchmark) {
    const lat = await measureLatency(ep, { method: 'GET' }, 25);
    results.latencies.push(lat);
    console.log(`- ${ep}: p50=${lat.p50}ms, p95=${lat.p95}ms, p99=${lat.p99}ms`);
  }

  // 2. Query Plan Profiling with explain("executionStats") in MongoDB
  console.log('\nRunning explain("executionStats") on high-frequency MongoDB queries...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('xydv');

  // Query A: Products Catalog Filter & Sort
  const prodCol = db.collection('products');
  const expProducts = await prodCol.find(
    { isPublished: true },
    { projection: { name: 1, slug: 1, price: 1, images: 1, variants: 1 } }
  ).sort({ createdAt: -1 }).limit(20).explain('executionStats');

  const statsProd = expProducts.executionStats;
  results.queryPlans.push({
    name: 'Products Catalog (Published, Sorted by createdAt DESC)',
    collection: 'products',
    indexUsed: expProducts.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
    stage: expProducts.queryPlanner.winningPlan.stage,
    nReturned: statsProd.nReturned,
    totalDocsExamined: statsProd.totalDocsExamined,
    executionTimeMillis: statsProd.executionTimeMillis,
    hasSortStage: JSON.stringify(expProducts).includes('"stage":"SORT"')
  });

  // Query B: Product by Slug (PDP lookup)
  const expProductSlug = await prodCol.find({ slug: 'qa-xydv-tactical-stealth-jacket' }).limit(1).explain('executionStats');
  const statsSlug = expProductSlug.executionStats;
  results.queryPlans.push({
    name: 'Product by Slug Lookup',
    collection: 'products',
    indexUsed: expProductSlug.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
    stage: expProductSlug.queryPlanner.winningPlan.stage,
    nReturned: statsSlug.nReturned,
    totalDocsExamined: statsSlug.totalDocsExamined,
    executionTimeMillis: statsSlug.executionTimeMillis,
    hasSortStage: false
  });

  // Query C: Orders User History
  const ordersCol = db.collection('orders');
  const expOrdersUser = await ordersCol.find({ user: new ObjectId() }).sort({ createdAt: -1 }).limit(10).explain('executionStats');
  const statsOrdersUser = expOrdersUser.executionStats;
  results.queryPlans.push({
    name: 'Customer Order History (User + createdAt DESC)',
    collection: 'orders',
    indexUsed: expOrdersUser.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
    stage: expOrdersUser.queryPlanner.winningPlan.stage,
    nReturned: statsOrdersUser.nReturned,
    totalDocsExamined: statsOrdersUser.totalDocsExamined,
    executionTimeMillis: statsOrdersUser.executionTimeMillis,
    hasSortStage: JSON.stringify(expOrdersUser).includes('"stage":"SORT"')
  });

  // Query D: Orders Admin Status & Date Filtering under 1,119 orders load
  const expOrdersAdmin = await ordersCol.find({
    status: 'delivered',
    createdAt: { $gte: new Date(Date.now() - 86400000 * 30) }
  }).sort({ createdAt: -1 }).limit(15).explain('executionStats');
  const statsOrdersAdmin = expOrdersAdmin.executionStats;
  results.queryPlans.push({
    name: 'Admin Orders Filter (status + createdAt DESC)',
    collection: 'orders',
    indexUsed: expOrdersAdmin.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
    stage: expOrdersAdmin.queryPlanner.winningPlan.stage,
    nReturned: statsOrdersAdmin.nReturned,
    totalDocsExamined: statsOrdersAdmin.totalDocsExamined,
    executionTimeMillis: statsOrdersAdmin.executionTimeMillis,
    hasSortStage: JSON.stringify(expOrdersAdmin).includes('"stage":"SORT"')
  });

  // Query E: Coupons Active Lookup
  const couponsCol = db.collection('coupons');
  const expCoupon = await couponsCol.find({ code: 'QA50', isActive: true }).limit(1).explain('executionStats');
  const statsCoupon = expCoupon.executionStats;
  results.queryPlans.push({
    name: 'Coupon Code Validation (code + isActive)',
    collection: 'coupons',
    indexUsed: expCoupon.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
    stage: expCoupon.queryPlanner.winningPlan.stage,
    nReturned: statsCoupon.nReturned,
    totalDocsExamined: statsCoupon.totalDocsExamined,
    executionTimeMillis: statsCoupon.executionTimeMillis,
    hasSortStage: false
  });

  console.log('Query plans extracted:');
  results.queryPlans.forEach(qp => {
    console.log(`- ${qp.name}: Index="${qp.indexUsed}", Examined=${qp.totalDocsExamined}, Returned=${qp.nReturned}, Time=${qp.executionTimeMillis}ms, SortStage=${qp.hasSortStage}`);
  });

  // 3. Test Route Authorization Matrix
  console.log('\nTesting Route Security Matrix across roles and tokens...');
  // A. Admin login
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-admin@xydv.test', password: 'AdminPassword123!' })
  });
  const adminToken = (await adminLoginRes.json()).token;

  // B. Customer login
  const customerLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-buyer-longname@xydv.test', password: 'AdminPassword123!' })
  });
  const customerToken = (await customerLoginRes.json()).token;

  // C. Blocked user login
  const blockedLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-blocked@xydv.test', password: 'AdminPassword123!' })
  });
  const blockedLoginStatus = blockedLoginRes.status;

  const routesToTest = [
    { method: 'GET', path: '/admin/orders', requiresAdmin: true },
    { method: 'POST', path: '/admin/products', requiresAdmin: true, body: {} },
    { method: 'POST', path: '/admin/discounts', requiresAdmin: true, body: {} },
    { method: 'POST', path: '/admin/coupons', requiresAdmin: true, body: {} },
    { method: 'POST', path: '/admin/notifications', requiresAdmin: true, body: {} },
    { method: 'GET', path: '/users/me', requiresAuth: true },
    { method: 'GET', path: '/products', requiresAuth: false },
    { method: 'POST', path: '/coupons/validate', requiresAuth: false, body: { code: 'QA50', orderAmountPaise: 200000 } }
  ];

  for (const r of routesToTest) {
    // Test 1: Unauthenticated
    const unauthRes = await fetch(`${API_URL}${r.path}`, {
      method: r.method,
      headers: { 'Content-Type': 'application/json' },
      body: r.body ? JSON.stringify(r.body) : undefined
    });

    // Test 2: Customer token
    const custRes = await fetch(`${API_URL}${r.path}`, {
      method: r.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: r.body ? JSON.stringify(r.body) : undefined
    });

    // Test 3: Admin token
    const admRes = await fetch(`${API_URL}${r.path}`, {
      method: r.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: r.body ? JSON.stringify(r.body) : undefined
    });

    const isSecure = (!r.requiresAuth || unauthRes.status === 401) &&
                     (!r.requiresAdmin || custRes.status === 403);

    results.routeSecurityMatrix.push({
      method: r.method,
      path: r.path,
      requiresAuth: !!r.requiresAuth || !!r.requiresAdmin,
      requiresAdmin: !!r.requiresAdmin,
      unauthenticatedStatus: unauthRes.status,
      customerStatus: custRes.status,
      adminStatus: admRes.status,
      isSecure
    });

    console.log(`- ${r.method} ${r.path}: Unauth=${unauthRes.status}, Cust=${custRes.status}, Admin=${admRes.status} -> ${isSecure ? 'SECURE' : 'GAP'}`);
  }

  // 4. Concurrency Test: Atomic stock decrement on last remaining unit
  console.log('\nTesting concurrency on atomic stock deduction...');
  // Seed single product with stock = 1
  const concProdId = new ObjectId();
  const concVariantId = new ObjectId();
  await prodCol.insertOne({
    _id: concProdId,
    name: 'QA-XYDV Concurrency Stock Guard Test',
    slug: 'qa-xydv-concurrency-test',
    price: 99900,
    mrpPaise: 149900,
    category: 'qa-xydv-tactical-activewear',
    images: ['/products/lookbook-cover.jpg'],
    variants: [{
      _id: concVariantId,
      size: 'M',
      color: 'Volt',
      stock: 1, // Only 1 unit in stock!
      sku: 'QA-CONC-001'
    }],
    isPublished: true,
    qaMarker: 'QA-XYDV',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Launch 5 concurrent order creation requests for the same single unit
  const orderPromises = [];
  for (let i = 0; i < 5; i++) {
    orderPromises.push(
      fetch(`${API_URL}/orders/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          items: [{
            productId: concProdId.toString(),
            variantId: concVariantId.toString(),
            quantity: 1,
            price: 99900,
            name: 'QA-XYDV Concurrency Stock Guard Test',
            size: 'M',
            color: 'Volt',
            sku: 'QA-CONC-001',
            slug: 'qa-xydv-concurrency-test'
          }],
          shippingAddress: {
            name: 'QA Concurrency Buyer',
            address: '100 Race Condition Blvd',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            phone: '+919876543210'
          }
        })
      }).then(async res => ({ status: res.status, json: await res.json() }))
    );
  }

  const concResults = await Promise.all(orderPromises);
  const successCount = concResults.filter(r => r.status === 200 || r.status === 201).length;
  const rejectedCount = concResults.filter(r => r.status === 400 || r.status === 409 || (r.json && !r.json.success)).length;

  // Check remaining stock in database
  const updatedConcProd = await prodCol.findOne({ _id: concProdId });
  const remainingStock = updatedConcProd.variants[0].stock;

  results.concurrencyResults = {
    test: 'Simultaneous purchase requests on last 1 unit',
    totalRequests: 5,
    successfulOrders: successCount,
    rejectedOrders: rejectedCount,
    remainingStockInDb: remainingStock,
    oversold: remainingStock < 0 || successCount > 1
  };

  console.log(`Concurrency Results: Success=${successCount}, Rejected=${rejectedCount}, Remaining Stock=${remainingStock}, Oversold=${results.concurrencyResults.oversold}`);

  // Cleanup concurrency test product
  await prodCol.deleteOne({ _id: concProdId });

  await client.close();

  const outPath = 'scratch/audit-results/backend-audit.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nBackend Audit Completed! Results written to ${outPath}`);
}

auditBackend().catch(err => {
  console.error('Backend Audit Failed:', err);
  process.exit(1);
});
