// Screenshot driver (Node 22+, no deps): serve game/ on :8080, open each
// ?shot= scene from shots.json in headless Chrome over CDP, wait for
// window.__shotReady, capture 1280x720 JPEG under 256 KiB.
//   node shots.mjs
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/hatch/workspace/x-session/chrome-extracted/opt/google/chrome/chrome';
const PORT = 9224;
const shots = JSON.parse(readFileSync('shots.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try { const res = await fetch(`http://127.0.0.1:${PORT}${path}`); if (res.ok) return await res.json(); } catch {}
    await sleep(500);
  }
  throw new Error(`no devtools endpoint ${path}`);
}

// Serve game/ if nothing is on :8080 already.
let server = null;
try { const r = await fetch('http://127.0.0.1:8080/index.html'); if (!r.ok) throw new Error('down'); }
catch {
  server = spawn(process.execPath, ['serve.ts'], { stdio: 'ignore' });
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch('http://127.0.0.1:8080/index.html'); if (r.ok) break; } catch {}
    await sleep(500);
  }
}

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-proxy-server', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/chrome-midnight-vault-shots', '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

try {
  const targets = await getJson('/json/list');
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      if (msg.error) pending.get(msg.id).reject(new Error(msg.error.message));
      else pending.get(msg.id).resolve(msg.result);
      pending.delete(msg.id);
    }
  };
  await new Promise((r) => { ws.onopen = r; });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (const shot of shots) {
    const url = `http://127.0.0.1:8080/index.html${shot.query}`;
    await send('Page.navigate', { url });
    const t0 = Date.now(); let ready = false, lastErr = '';
    while (Date.now() - t0 < 120000) {
      const r = await send('Runtime.evaluate', { expression: `window.__shotReady ? 'ready' : (window.__shotError || '')`, returnByValue: true });
      const v = r && r.result ? r.result.value : '';
      if (v === 'ready') { ready = true; break; }
      if (v) lastErr = v;
      await sleep(400);
    }
    if (!ready) throw new Error(`shot ${shot.name} never became ready (${lastErr})`);
    // Collect console errors for diagnosis.
    const shotRes = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    const buf = Buffer.from(shotRes.data, 'base64');
    writeFileSync(`screenshots/${shot.name}`, buf);
    console.log(shot.name, buf.length, 'bytes');
  }
} finally {
  chrome.kill();
  if (server) server.kill();
}
