// A minimal Chrome DevTools Protocol client (Node 22+, standard library only): launches a headless
// Chrome at a fixed window size, opens one page, and offers navigate / evaluate / click / screenshot.
// Used by capture-shots.mjs; not part of the game.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Launch headless Chrome sized `width` x `height` and return a page handle. */
export async function openBrowser({ width = 1280, height = 720, port = 9333 } = {}) {
  const executable = CHROME_PATHS.find((path) => existsSync(path));
  if (!executable) throw new Error('no Chrome found; set CHROME_PATH');
  const profile = mkdtempSync(join(tmpdir(), 'ember-duel-chrome-'));
  const chrome = spawn(executable, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let attempt = 0; attempt < 50 && !targets; attempt += 1) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      targets = list.filter((target) => target.type === 'page');
      if (targets.length === 0) targets = null;
    } catch {
      targets = null;
    }
  }
  if (!targets) throw new Error('Chrome did not open its debugging port');

  const socket = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 1;
  const pending = new Map();
  const consoleLines = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      consoleLines.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
    } else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      consoleLines.push(`${message.params.type}: ${message.params.args.map((arg) => arg.value ?? arg.description).join(' ')}`);
    } else if (message.method === 'Network.requestWillBeSent') {
      consoleLines.push(`request: ${message.params.request.url}`);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  const page = {
    consoleLines,
    async navigate(url, settleMs = 600) {
      await send('Page.navigate', { url });
      await sleep(settleMs);
    },
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate failed');
      return result.result.value;
    },
    async click(x, y) {
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
    },
    async key(key) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key });
    },
    async screenshot(format = 'jpeg', quality = 90) {
      const result = await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? quality : undefined });
      return Buffer.from(result.data, 'base64');
    },
    async close() {
      socket.close();
      chrome.kill();
      await sleep(400);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome may still hold the profile for a moment; the temp folder is harmless.
      }
    },
  };
  return page;
}
