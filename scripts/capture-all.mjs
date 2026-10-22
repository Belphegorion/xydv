import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9231;
const TMP_DIR = path.join(os.tmpdir(), 'chrome_cdp_screens_' + Date.now());

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}: ${data}`));
          }
        });
      })
      .on('error', reject);
  });
}

const mockScript = `
(() => {
  const origFetch = window.fetch;
  window.fetch = async function(url, init) {
    const urlStr = String(url);
    if (urlStr.includes('/auth/refresh') || urlStr.includes('/auth/login')) {
      return new Response(JSON.stringify({
        token: 'mock-admin-jwt-token-xydv',
        data: {
          _id: 'admin_1',
          name: 'Lead Director',
          email: 'admin@xydv.com',
          role: 'admin',
          isBlocked: false
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/analytics')) {
      return new Response(JSON.stringify({
        data: {
          period: '30d',
          totalRevenue: 2845000,
          totalOrders: 1420,
          totalCustomers: 890,
          lowStockCount: 2,
          pageViews: 45200,
          conversionRate: 3.14,
          revenueByDate: [
            { date: '2026-10-01', revenue: 95000, orders: 48 },
            { date: '2026-10-05', revenue: 112000, orders: 56 },
            { date: '2026-10-10', revenue: 88000, orders: 42 },
            { date: '2026-10-15', revenue: 134000, orders: 67 },
            { date: '2026-10-20', revenue: 152000, orders: 75 }
          ],
          orderStatusDistribution: [
            { status: 'delivered', count: 980 },
            { status: 'shipped', count: 240 },
            { status: 'processing', count: 150 },
            { status: 'pending', count: 40 },
            { status: 'cancelled', count: 10 }
          ],
          topSellingProducts: [
            { id: '1', name: 'ASRV TACTICAL HYBRID SHORT', quantity: 340, revenue: 680000 },
            { id: '2', name: 'OBSIDIAN RAIN SHELL 3L', quantity: 210, revenue: 840000 },
            { id: '3', name: 'VOLT REFLECTIVE COMPRESSION TEE', quantity: 450, revenue: 540000 }
          ]
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/products')) {
      return new Response(JSON.stringify({
        data: [
          {
            _id: 'p1',
            name: 'ASRV TACTICAL HYBRID SHORT',
            slug: 'asrv-tactical-hybrid-short',
            category: 'bottoms',
            price: 6800,
            stock: 45,
            isPublished: true,
            variants: [{ sku: 'SHORT-BLK-M', size: 'M', color: 'Black', stock: 25 }]
          },
          {
            _id: 'p2',
            name: 'OBSIDIAN RAIN SHELL 3L',
            slug: 'obsidian-rain-shell-3l',
            category: 'outerwear',
            price: 18500,
            stock: 12,
            isPublished: true,
            variants: [{ sku: 'SHELL-BLK-L', size: 'L', color: 'Obsidian', stock: 12 }]
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/categories')) {
      return new Response(JSON.stringify({
        data: [
          { _id: 'c1', name: 'Tops', slug: 'tops', productCount: 8 },
          { _id: 'c2', name: 'Bottoms', slug: 'bottoms', productCount: 6 },
          { _id: 'c3', name: 'Outerwear', slug: 'outerwear', productCount: 4 },
          { _id: 'c4', name: 'Accessories', slug: 'accessories', productCount: 5 }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/orders')) {
      return new Response(JSON.stringify({
        data: [
          {
            _id: 'ord_101',
            orderNumber: 'XYDV-2026-001',
            customer: { name: 'Devon Archer', email: 'devon@xydv.com' },
            total: 25300,
            status: 'delivered',
            paymentStatus: 'captured',
            createdAt: '2026-10-20T14:32:00Z',
            items: [{ name: 'OBSIDIAN RAIN SHELL 3L', quantity: 1, price: 18500 }]
          },
          {
            _id: 'ord_102',
            orderNumber: 'XYDV-2026-002',
            customer: { name: 'Elena Rostova', email: 'elena@xydv.com' },
            total: 13600,
            status: 'processing',
            paymentStatus: 'captured',
            createdAt: '2026-10-21T09:15:00Z',
            items: [{ name: 'ASRV TACTICAL HYBRID SHORT', quantity: 2, price: 6800 }]
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/inventory/low-stock')) {
      return new Response(JSON.stringify({ count: 2 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/inventory')) {
      return new Response(JSON.stringify({
        data: [
          {
            _id: 'p2',
            name: 'OBSIDIAN RAIN SHELL 3L',
            sku: 'SHELL-BLK-L',
            category: 'outerwear',
            stock: 3,
            threshold: 5
          },
          {
            _id: 'p3',
            name: 'VOLT REFLECTIVE COMPRESSION TEE',
            sku: 'TEE-VOLT-S',
            category: 'tops',
            stock: 2,
            threshold: 5
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/customers')) {
      return new Response(JSON.stringify({
        data: [
          {
            _id: 'cust_1',
            name: 'Devon Archer',
            email: 'devon@xydv.com',
            role: 'customer',
            isBlocked: false,
            ordersCount: 4,
            totalSpent: 48900,
            createdAt: '2026-08-15T11:20:00Z'
          },
          {
            _id: 'cust_2',
            name: 'Elena Rostova',
            email: 'elena@xydv.com',
            role: 'customer',
            isBlocked: false,
            ordersCount: 2,
            totalSpent: 13600,
            createdAt: '2026-09-02T16:45:00Z'
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/admin/settings')) {
      return new Response(JSON.stringify({
        data: {
          storeName: 'XYDV ARCHIVE',
          contactEmail: 'contact@xydv.com',
          currency: 'INR',
          freeShippingThreshold: 15000,
          taxRate: 18,
          maintenanceMode: false
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return origFetch(url, init);
  };
})();
`;

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=' + PORT,
      '--remote-allow-origins=*',
      '--user-data-dir=' + TMP_DIR,
      '--window-size=1440,900',
      '--no-sandbox',
      '--disable-gpu',
      'about:blank',
    ],
    { detached: false },
  );

  let connected = false;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      await getJson(`http://127.0.0.1:${PORT}/json/version`);
      connected = true;
      break;
    } catch {}
  }

  if (!connected) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port ' + PORT);
  }

  const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
  const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let nextId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: mockScript });

  const outDir = path.resolve('docs', 'screenshots', 'after');
  fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { name: 'login-1440.png', url: 'http://localhost:3000/admin/login', width: 1440, height: 900 },
    { name: 'login-768.png', url: 'http://localhost:3000/admin/login', width: 768, height: 1024 },
    { name: 'login-390.png', url: 'http://localhost:3000/admin/login', width: 390, height: 844 },
    { name: 'storefront-home-1440.png', url: 'http://localhost:3000', width: 1440, height: 900 },
    {
      name: 'storefront-products-1440.png',
      url: 'http://localhost:3000/products',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-dashboard-1440.png',
      url: 'http://localhost:3000/admin',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-products-1440.png',
      url: 'http://localhost:3000/admin/products',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-categories-1440.png',
      url: 'http://localhost:3000/admin/categories',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-orders-1440.png',
      url: 'http://localhost:3000/admin/orders',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-inventory-1440.png',
      url: 'http://localhost:3000/admin/inventory',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-customers-1440.png',
      url: 'http://localhost:3000/admin/customers',
      width: 1440,
      height: 900,
    },
    {
      name: 'admin-settings-1440.png',
      url: 'http://localhost:3000/admin/settings',
      width: 1440,
      height: 900,
    },
  ];

  for (const t of targets) {
    console.log(`Capturing ${t.name}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: t.width,
      height: t.height,
      deviceScaleFactor: 1,
      mobile: t.width < 600,
    });
    await send('Page.navigate', { url: t.url });
    // Wait for preloader to complete and DOM to settle
    await new Promise((r) => setTimeout(r, 2200));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const targetPath = path.join(outDir, t.name);
    fs.writeFileSync(targetPath, Buffer.from(ss.data, 'base64'));
    console.log(`Saved ${t.name} (${fs.statSync(targetPath).size} bytes)`);
  }

  ws.close();
  chromeProc.kill();
  console.log('All screenshots captured successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
