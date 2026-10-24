import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.resolve('scratch/audit-results');

const targets = [
  { name: 'Storefront Home (Mobile)', path: '/', device: { width: 390, height: 844, isMobile: true } },
  { name: 'Storefront Home (Desktop)', path: '/', device: { width: 1440, height: 900, isMobile: false } },
  { name: 'Catalog Listing (Mobile)', path: '/products', device: { width: 390, height: 844, isMobile: true } },
  { name: 'Catalog Listing (Desktop)', path: '/products', device: { width: 1440, height: 900, isMobile: false } },
  { name: 'Product Detail (Mobile)', path: '/products/apex-modular-training-shorts', device: { width: 390, height: 844, isMobile: true } },
  { name: 'Product Detail (Desktop)', path: '/products/apex-modular-training-shorts', device: { width: 1440, height: 900, isMobile: false } },
  { name: 'Admin Dashboard (Desktop)', path: '/admin', device: { width: 1440, height: 900, isMobile: false }, needsAdmin: true },
  { name: 'Admin Orders (Desktop)', path: '/admin/orders', device: { width: 1440, height: 900, isMobile: false }, needsAdmin: true }
];

async function measurePage(browser, target) {
  const context = await browser.newContext({
    viewport: { width: target.device.width, height: target.device.height },
    isMobile: target.device.isMobile,
    userAgent: target.device.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      : undefined
  });

  const page = await context.newPage();

  // If admin is needed, login first
  if (target.needsAdmin) {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'qa-admin@xydv.test');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  // Inject web-vitals tracking before navigation
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, fcp: 0, ttfb: 0, domInteractive: 0, domComplete: 0 };
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__vitals.lcp = entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__vitals.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__vitals.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });
  });

  const startTime = Date.now();
  await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1000); // Allow LCP and CLS observers to settle

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const ttfb = nav.responseStart ? nav.responseStart - nav.requestStart : 0;
    const domInteractive = nav.domInteractive || 0;
    const domComplete = nav.domComplete || 0;
    const transferSize = nav.transferSize || 0;
    const encodedBodySize = nav.encodedBodySize || 0;
    
    // Count DOM nodes
    const totalDomNodes = document.querySelectorAll('*').length;

    return {
      ttfb: Math.round(ttfb),
      domInteractive: Math.round(domInteractive),
      domComplete: Math.round(domComplete),
      fcp: Math.round(window.__vitals?.fcp || 0),
      lcp: Math.round(window.__vitals?.lcp || 0),
      cls: Number((window.__vitals?.cls || 0).toFixed(4)),
      transferSizeKb: Math.round(transferSize / 1024),
      encodedBodySizeKb: Math.round(encodedBodySize / 1024),
      totalDomNodes
    };
  });

  await context.close();
  return {
    target: target.name,
    path: target.path,
    viewport: `${target.device.width}x${target.device.height}`,
    metrics
  };
}

async function run() {
  console.log('Launching browser for Web Vitals & Performance audit...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];

  for (const t of targets) {
    try {
      console.log(`Auditing: ${t.name}...`);
      const res = await measurePage(browser, t);
      results.push(res);
      console.log(`  -> FCP: ${res.metrics.fcp}ms, LCP: ${res.metrics.lcp}ms, CLS: ${res.metrics.cls}, TTFB: ${res.metrics.ttfb}ms, DOM Nodes: ${res.metrics.totalDomNodes}`);
    } catch (err) {
      console.error(`  x Error on ${t.name}:`, err.message);
      results.push({ target: t.name, path: t.path, error: err.message });
    }
  }

  await browser.close();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'web-vitals.json'), JSON.stringify(results, null, 2));
  console.log('Web vitals saved to scratch/audit-results/web-vitals.json');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
