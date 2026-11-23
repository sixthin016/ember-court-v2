// Screenshot driver for Ember Court v2 (best-card-game-20261122-1826).
// Uses Chrome DevTools Protocol over Node's built-in WebSocket — no
// npm deps. Serves game/ on :8093, drives a real render in headless
// Chromium, and writes 4 JPEG screenshots (1280x720, quality 78)
// into screenshots/, one per entry in shots.json. It also prints any
// console error or failed request, so a broken game shows up here
// instead of in the entry.
//
// Usage: node shots-driver.mjs
// Requires: the chromium binary from the Playwright cache.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('.', import.meta.url));
const SHOTS = join(REPO, 'screenshots');
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const PROFILE = '/tmp/ember-court-v2-shots-profile';
const DEBUG_PORT = 9226;
const PORT = 8093;
const BASE = `http://localhost:${PORT}/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        console.log('CONSOLE ERROR:', JSON.stringify(msg.params.args.map((a) => a.value ?? a.description)));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('PAGE EXCEPTION:', JSON.stringify(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text));
      }
      if (msg.method === 'Network.loadingFailed') {
        console.log('NETWORK FAILED:', msg.params.errorText);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed');
    return result.result.value;
  }
}

async function waitForShot(cdp, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await cdp.eval('window.__shotReady === true')) return true;
    await sleep(200);
  }
  return false;
}

async function main() {
  const shots = JSON.parse(readFileSync(join(REPO, 'shots.json'), 'utf8'));
  mkdirSync(SHOTS, { recursive: true });

  let server = null;
  try {
    const probe = await fetch(BASE);
    const text = await probe.text();
    if (!text.includes('Ember Court')) throw new Error('wrong server on port');
    console.log(`server already up on :${PORT} (ours)`);
  } catch {
    server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: REPO, stdio: 'inherit' });
    await sleep(1500);
  }

  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${PROFILE}`,
    '--window-size=1280,720', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let targets = null;
    for (let attempt = 0; attempt < 30 && !targets; attempt += 1) {
      await sleep(500);
      try { targets = await fetchJson(`http://localhost:${DEBUG_PORT}/json`); } catch { /* not up yet */ }
    }
    if (!targets) throw new Error('chrome did not open its debugging port');
    const page = targets.find((t) => t.type === 'page');
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

    for (const shot of shots) {
      await cdp.send('Page.navigate', { url: BASE + shot.query });
      await sleep(900);
      const ready = await waitForShot(cdp);
      const info = await cdp.eval('window.__shot ?? null');
      console.log(`${shot.name}: ready=${ready} info=${JSON.stringify(info)}`);
      if (!ready) throw new Error(`shot ${shot.name} never became ready`);
      const capture = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
      writeFileSync(join(SHOTS, shot.name), Buffer.from(capture.data, 'base64'));
      const { size } = await import('node:fs').then((fs) => fs.statSync(join(SHOTS, shot.name)));
      console.log(`wrote ${shot.name} (${size} bytes)`);
    }
  } finally {
    chrome.kill('SIGKILL');
    if (server) server.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
