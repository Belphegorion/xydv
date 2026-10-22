import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const TMP_DIR = path.join(os.tmpdir(), 'cdp_test_' + Date.now());

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testMobile() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--remote-allow-origins=*',
    '--user-data-dir=' + TMP_DIR,
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      await getJson('http://127.0.0.1:' + PORT + '/json/version');
      break;
    } catch {}
  }

  const tabs = await getJson('http://127.0.0.1:' + PORT + '/json/list');
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
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

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  const devices = [
    { name: 'iphone14', width: 390, height: 844, dpr: 3 },
    { name: 'iphonese', width: 375, height: 667, dpr: 2 },
    { name: 'pixel7', width: 412, height: 915, dpr: 2.625 },
    { name: 'landscape', width: 740, height: 360, dpr: 2 }
  ];

  fs.mkdirSync('screenshots/mobile', { recursive: true });

  for (const dev of devices) {
    console.log('Testing device:', dev.name);
    await send('Emulation.setDeviceMetricsOverride', {
      width: dev.width,
      height: dev.height,
      deviceScaleFactor: dev.dpr,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3500));

    // Capture frame 0 (scroll 0)
    const ss0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/mobile/${dev.name}-scroll0.png`, Buffer.from(ss0.data, 'base64'));

    // Check canvas dimensions and positions
    const layout = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('#hero-section canvas');
        const hero = document.getElementById('hero-section');
        return {
          canvas: canvas ? { width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight } : null,
          heroHeight: hero ? hero.clientHeight : null,
          maxScroll: document.documentElement.scrollHeight - window.innerHeight
        };
      })()`,
      returnByValue: true
    });
    console.log(`Device [${dev.name}] layout:`, layout.result.value);

    // Scroll to 50%
    const maxScroll = layout.result.value.maxScroll || 2000;
    const midScroll = Math.round(maxScroll * 0.5);
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${midScroll}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 600));
    const ss50 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/mobile/${dev.name}-scroll50.png`, Buffer.from(ss50.data, 'base64'));

    // Scroll to 92% climax
    const climaxScroll = Math.round(maxScroll * 0.92);
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${climaxScroll}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 600));
    const ss92 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/mobile/${dev.name}-scroll92.png`, Buffer.from(ss92.data, 'base64'));
  }

  ws.close();
  chromeProc.kill();
  console.log('Done mobile tests');
}

testMobile().catch(console.error);
