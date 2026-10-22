import http from 'node:http';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          })
        );
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  console.log('='.repeat(70));
  console.log(' LIVE STOREFRONT ROUTE & PREFETCH PROBE SUITE');
  console.log('='.repeat(70));

  const routes = [
    '/',
    '/products',
    '/sizing',
    '/shipping',
    '/returns',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/wishlist',
    '/products/volt-performance-tee',
    '/products/apex-modular-training-shorts',
    '/products/storm-shield-ripstop-shell',
    '/products/ballistic-fidlock-cap',
    '/products/aeroflex-seamless-crop-top',
    '/products/thermal-compression-cargo-set',
    '/products/kinetic-heavyweight-hoodie',
    '/products/stealth-cargo-pant',
    '/products/covert-tactical-vest',
    '/products/stealth-aero-windbreaker',
    '/products/women-stealth-packable-shell',
    '/products/ballistic-modular-sling-pack',
    '/products/aeroflex-high-support-sports-bra',
  ];

  let passed = 0;
  let failed = 0;

  console.log('\n[1] Probing Full HTML Document Routes:');
  for (const r of routes) {
    const res = await request(`http://localhost:3000${r}`);
    if (res.statusCode === 200) {
      console.log(`  ✓ 200 OK: ${r}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL ${res.statusCode}: ${r}`);
      failed++;
    }
  }

  console.log('\n[2] Probing RSC Client-Side Prefetch (Button & Link Hover Simulation):');
  for (const r of routes) {
    const res = await request(`http://localhost:3000${r}`, {
      headers: {
        RSC: '1',
        'Next-Router-Prefetch': '1',
        'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      },
    });
    if (res.statusCode === 200) {
      console.log(`  ✓ 200 RSC Prefetched: ${r}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL RSC ${res.statusCode}: ${r}`);
      failed++;
    }
  }

  console.log('\n[3] Probing API Routes:');
  const apiProducts = await request('http://localhost:3000/api/products');
  const productsJson = JSON.parse(apiProducts.body);
  if (apiProducts.statusCode === 200 && Array.isArray(productsJson.products)) {
    console.log(`  ✓ 200 OK: /api/products (${productsJson.products.length} products returned)`);
    passed++;
  } else {
    console.error(`  ✗ FAIL /api/products: ${apiProducts.statusCode}`);
    failed++;
  }

  const apiSlug = await request('http://localhost:3000/api/products/volt-performance-tee');
  if (apiSlug.statusCode === 200 && JSON.parse(apiSlug.body).product?.slug === 'volt-performance-tee') {
    console.log('  ✓ 200 OK: /api/products/volt-performance-tee (valid product JSON)');
    passed++;
  } else {
    console.error(`  ✗ FAIL /api/products/volt-performance-tee: ${apiSlug.statusCode}`);
    failed++;
  }

  const api404 = await request('http://localhost:3000/api/products/non-existent-slug-404');
  if (api404.statusCode === 404) {
    console.log('  ✓ 404 OK: /api/products/non-existent-slug-404 (clean 404 response)');
    passed++;
  } else {
    console.error(`  ✗ FAIL 404 test: expected 404, got ${api404.statusCode}`);
    failed++;
  }

  const contactRes = await request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verification Bot',
      email: 'verify@xydv.com',
      topic: 'Sizing & Fit Consultation',
      message: 'Automated verification test payload.',
    }),
  });
  const contactJson = JSON.parse(contactRes.body);
  if (contactRes.statusCode === 200 && contactJson.success && contactJson.ticketId) {
    console.log(`  ✓ 200 OK: POST /api/contact (ticketId: ${contactJson.ticketId})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL POST /api/contact: ${contactRes.statusCode}`);
    failed++;
  }

  console.log('\n[4] Probing Next.js Turbopack Development Manifests:');
  const buildManifest = await request('http://localhost:3000/_next/static/development/_buildManifest.js');
  if (buildManifest.statusCode === 200 && buildManifest.body.includes('self.__BUILD_MANIFEST')) {
    console.log('  ✓ 200 OK: /_next/static/development/_buildManifest.js (manifest intact)');
    passed++;
  } else {
    console.error(`  ✗ FAIL _buildManifest.js: ${buildManifest.statusCode}`);
    failed++;
  }

  const ssgManifest = await request('http://localhost:3000/_next/static/development/_ssgManifest.js');
  if (ssgManifest.statusCode === 200 && ssgManifest.body.includes('self.__SSG_MANIFEST')) {
    console.log('  ✓ 200 OK: /_next/static/development/_ssgManifest.js (SSG manifest intact)');
    passed++;
  } else {
    console.error(`  ✗ FAIL _ssgManifest.js: ${ssgManifest.statusCode}`);
    failed++;
  }

  console.log('='.repeat(70));
  console.log(` RESULTS: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
