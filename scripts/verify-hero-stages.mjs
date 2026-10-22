import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const TMP_DIR = path.join(os.tmpdir(), 'cdp_hero_' + Date.now());

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
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function testHeroScroll() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--remote-allow-origins=*',
    '--user-data-dir=' + TMP_DIR,
    '--no-sandbox',
    '--disable-gpu',
    'about:blank',
  ]);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      await getJson('http://127.0.0.1:' + PORT + '/json/version');
      break;
    } catch {}
  }

  const tabs = await getJson('http://127.0.0.1:' + PORT + '/json/list');
  const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
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

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  // iPhone 14
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 3500));

  const heroMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.getElementById('hero-section');
      const heroScrollDistance = hero.offsetHeight - window.innerHeight;
      return { heroHeight: hero.offsetHeight, windowHeight: window.innerHeight, heroScrollDistance };
    })()`,
    returnByValue: true,
  });
  console.log('Hero metrics:', heroMetrics.result.value);

  const { heroScrollDistance } = heroMetrics.result.value;

  const steps = [
    { name: '00pct-stage1', progress: 0.0 },
    { name: '25pct-stage1exit', progress: 0.25 },
    { name: '50pct-stage2', progress: 0.5 },
    { name: '80pct-stage3climax', progress: 0.8 },
    { name: '94pct-stage3cue', progress: 0.94 },
  ];

  fs.mkdirSync('screenshots/hero-stages', { recursive: true });

  for (const step of steps) {
    const scrollY = Math.round(step.progress * heroScrollDistance);
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })`,
    });
    await new Promise((r) => setTimeout(r, 600));

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
      returnByValue: true,
    });
    console.log(`Step [${step.name}]:`, info.result.value);

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/hero-stages/${step.name}.png`, Buffer.from(ss.data, 'base64'));
  }

  ws.close();
  chromeProc.kill();
  console.log('Done hero stages');
}

testHeroScroll().catch(console.error);
