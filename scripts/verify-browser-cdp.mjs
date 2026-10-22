import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const TARGET_URL = 'http://localhost:3000';
const TMP_DIR = path.join(os.tmpdir(), 'chrome_cdp_verify_' + Date.now());

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

async function run() {
  console.log('=== Precision Multi-Stage CDP Verification ===');
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=' + PORT,
      '--remote-allow-origins=*',
      '--user-data-dir=' + TMP_DIR,
      '--window-size=1280,800',
      '--no-sandbox',
      '--disable-gpu',
      'about:blank',
    ],
    { detached: false },
  );

  let connected = false;
  for (let i = 0; i < 20; i++) {
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
  const consoleErrors = [];
  const network404s = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }

    if (msg.method === 'Console.messageAdded' && msg.params.message.level === 'error') {
      consoleErrors.push(msg.params.message.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text);
    }
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      network404s.push(`${msg.params.response.status} ${msg.params.response.url}`);
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
  await send('Network.enable');
  await send('Console.enable');

  await send('Page.navigate', { url: TARGET_URL });
  await new Promise((r) => setTimeout(r, 3500));

  const dirScreenshots = path.resolve('screenshots');
  fs.mkdirSync(dirScreenshots, { recursive: true });

  const testPoints = [
    { name: 'stage1-frame001', scroll: 0 },
    { name: 'stage2-frame070', scroll: 800 },
    { name: 'stage3-climax-frame140', scroll: 1550 },
  ];

  for (const pt of testPoints) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${pt.scroll}, behavior: 'instant' })`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const evalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll('#hero-section span'));
        const counter = spans.find(s => s.textContent && s.textContent.includes('/ 180'));
        const telemetry = spans.find(s => s.textContent && s.textContent.includes('SEQ '));
        const canvas = document.querySelector('#hero-section canvas');
        return {
          counterText: counter ? counter.textContent.trim() : null,
          telemetryText: telemetry ? telemetry.textContent.trim() : null,
          canvasDimensions: canvas ? { width: canvas.width, height: canvas.height } : null,
          scrollY: window.scrollY
        };
      })()`,
      returnByValue: true,
    });

    console.log(`Point [${pt.name}]:`, evalData.result.value);

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(dirScreenshots, `${pt.name}.png`), Buffer.from(ss.data, 'base64'));
  }

  console.log('Console Errors:', consoleErrors);
  console.log('Network 4xx/5xx:', network404s);

  ws.close();
  chromeProc.kill();
  console.log('Verification finished.');
}

run().catch(console.error);
