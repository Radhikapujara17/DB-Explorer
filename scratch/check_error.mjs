import http from 'http';
import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const REMOTE_PORT = 9251;
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.value;
  }
}

async function debug() {
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${REMOTE_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1280,800',
    '--user-data-dir=C:/Users/Radhika/AppData/Local/Temp/edge_err_debug_2'
  ], { detached: true });

  await delay(1500);
  const targets = await getJson(`http://localhost:${REMOTE_PORT}/json`);
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CdpSession(ws);

  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: 'http://localhost:8080' });
  await delay(3000);

  const lastErr = await cdp.evaluate('window.__lastError');
  console.log('Captured __lastError:', JSON.stringify(lastErr, null, 2));

  try { process.kill(browserProc.pid); } catch {}
}

debug().catch(console.error);
