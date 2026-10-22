import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const TMP_DIR = path.join(os.tmpdir(), 'cdp_verify_final_' + Date.now());

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

async function runVerification() {
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
  const consoleErrors = [];

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
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

  fs.mkdirSync('screenshots/verified', { recursive: true });

  for (const dev of devices) {
    console.log(`\n=== Testing Device: ${dev.name} (${dev.width}x${dev.height}, DPR ${dev.dpr}) ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: dev.width,
      height: dev.height,
      deviceScaleFactor: dev.dpr,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3500));

    const heroMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('hero-section');
        const canvas = document.querySelector('#hero-section canvas');
        return {
          heroHeight: hero ? hero.offsetHeight : 0,
          windowHeight: window.innerHeight,
          scrollDistance: hero ? hero.offsetHeight - window.innerHeight : 0,
          canvasWidth: canvas ? canvas.width : 0,
          canvasHeight: canvas ? canvas.height : 0,
          canvasClientWidth: canvas ? canvas.clientWidth : 0,
          canvasClientHeight: canvas ? canvas.clientHeight : 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Metrics:', heroMetrics.result.value);

    const dist = heroMetrics.result.value.scrollDistance;

    const stages = [
      { name: 'stage1-00pct', progress: 0.0 },
      { name: 'stage2-50pct', progress: 0.50 },
      { name: 'stage3-85pct', progress: 0.85 },
      { name: 'climax-95pct', progress: 0.95 }
    ];

    for (const st of stages) {
      const scrollY = Math.round(st.progress * dist);
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })`
      });
      await new Promise(r => setTimeout(r, 600));

      const info = await send('Runtime.evaluate', {
        expression: `(() => {
          const spans = Array.from(document.querySelectorAll('#hero-section span'));
          const counter = spans.find(s => s.textContent && s.textContent.includes('/ 180'));
          const telemetry = spans.find(s => s.textContent && s.textContent.includes('SEQ '));
          return {
            scrollY: window.scrollY,
            counter: counter ? counter.textContent.trim() : null,
            telemetry: telemetry ? telemetry.textContent.trim() : null
          };
        })()`,
        returnByValue: true
      });

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `screenshots/verified/${dev.name}-${st.name}.png`;
      fs.writeFileSync(filename, Buffer.from(ss.data, 'base64'));
      console.log(`Saved ${filename} [${info.result.value.counter || 'N/A'}]`);
    }
  }

  console.log('\nConsole Errors:', consoleErrors);

  ws.close();
  chromeProc.kill();
  console.log('Verification run complete.');
}

runVerification().catch(console.error);
