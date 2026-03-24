// ==UserScript==
// @name         xBatcher
// @namespace    xGEN
// @version      1.1.0
// @description  Batch prompt testing and image downloading on Venice.ai
// @match        https://venice.ai/chat*
// @grant        GM_download
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  let running = false;
  let abortFlag = false;
  let history = [];

  // ─── API Discovery (intercept fetch to find Venice endpoints) ─────────────
  (function hookFetch() {
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const method = args[1]?.method || 'GET';
      const body = args[1]?.body;

      if (
        url.includes('venice.ai') &&
        !url.includes('clerk.venice.ai') &&
        !url.includes('ph.venice.ai') &&
        !url.includes('veniceai-status.com') &&
        !url.startsWith('blob:')
      ) {
        console.log(`[xBatcher:API] ${method} ${url}`);
        if (body && typeof body === 'string') {
          try {
            console.log('[xBatcher:API] Body:', JSON.parse(body));
          } catch {
            console.log('[xBatcher:API] Body:', body.substring(0, 500));
          }
        }
      }

      return origFetch.apply(this, args);
    };
    console.log('[xBatcher] Fetch interceptor installed');
  })();

  // ─── Selectors ────────────────────────────────────────────────────────────

  const SEL = {
    promptTextarea: 'textarea[name="prompt-textarea"]',
    submitButton: 'button[type="submit"][aria-label="Submit chat"]',
    imageOutput: '.image-message img, [data-testid="image-message"] img, img[src*="venice"]',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function waitFor(predicate, { interval = 500, timeout = 60000 } = {}) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const val = predicate();
        if (val) return resolve(val);
        if (Date.now() - start > timeout) return reject(new Error('waitFor timeout'));
        setTimeout(tick, interval);
      };
      tick();
    });
  }

  async function waitForCondition(conditionFn, timeout) {
    const start = Date.now();
    while (!conditionFn()) {
      if (Date.now() - start > timeout) throw new Error('Condition timeout');
      await sleep(100);
    }
  }

  function setReactValue(element, value) {
    const proto = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    const setter = descriptor?.set;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ─── DOM Accessors ────────────────────────────────────────────────────────

  function getPromptTextarea() {
    return document.querySelector(SEL.promptTextarea);
  }

  function getSubmitButton() {
    return document.querySelector(SEL.submitButton);
  }

  function getNewChatButton() {
    const header = document.querySelector('.chat-header');
    if (!header) return null;
    const btns = header.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.trim().includes('New chat')) return b;
    }
    return null;
  }

  function getLatestImage() {
    const imgs = document.querySelectorAll(SEL.imageOutput);
    return imgs[imgs.length - 1] || null;
  }

  // ─── Core Actions ─────────────────────────────────────────────────────────

  function injectPrompt(text) {
    const ta = getPromptTextarea();
    if (!ta) throw new Error('Prompt textarea not found');
    setReactValue(ta, text);
  }

  async function clickSubmit() {
    const btn = getSubmitButton();
    if (!btn) throw new Error('Submit button not found');
    if (btn.disabled) {
      log('Submit button disabled, waiting...');
      await waitForCondition(() => !btn.disabled, 10000);
    }
    btn.click();
  }

  async function startNewChat() {
    const btn = getNewChatButton();
    if (!btn) throw new Error('New chat button not found');
    btn.click();
    await sleep(2000);
    await waitFor(() => getPromptTextarea(), { interval: 500, timeout: 15000 });
  }

  // ─── Image Detection ──────────────────────────────────────────────────────

  function waitForNewImage(previousSrc, timeout = 120000) {
    return new Promise((resolve, reject) => {
      let settled = false;

      function check() {
        const latest = getLatestImage();
        if (
          latest &&
          latest.src &&
          latest.src !== previousSrc &&
          !latest.src.startsWith('data:')
        ) {
          return latest;
        }
        return null;
      }

      const immediate = check();
      if (immediate) {
        return resolve(immediate);
      }

      const observer = new MutationObserver(() => {
        const found = check();
        if (found && !settled) {
          settled = true;
          observer.disconnect();
          clearTimeout(fallbackTimer);
          resolve(found);
        }
      });

      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
      });

      const fallbackTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          observer.disconnect();
          reject(new Error('Timeout: no new image detected'));
        }
      }, timeout);
    });
  }

  // ─── Download ─────────────────────────────────────────────────────────────

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function downloadBlob(blob, filename) {
    const dataUrl = await blobToDataURL(blob);
    if (typeof GM_download === 'function') {
      GM_download({ url: dataUrl, name: filename, saveAs: false });
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function fetchImageBlob(src) {
    const resp = await fetch(src);
    return await resp.blob();
  }

  function getExtension(blob) {
    const map = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
    };
    return map[blob.type] || 'png';
  }

  // ─── Prompt History ───────────────────────────────────────────────────────

  function addHistoryEntry(entry) {
    history.unshift(entry);
    if (history.length > 200) history.length = 200;
    renderHistory();
  }

  function renderHistory() {
    const el = document.getElementById('xb-history');
    if (!el) return;
    if (history.length === 0) {
      el.innerHTML = '<div style="color:#6c7086;font-style:italic;padding:4px 0;">No history yet</div>';
      return;
    }
    el.innerHTML = history.slice(0, 50).map((h, i) => {
      const time = new Date(h.timestamp).toLocaleTimeString();
      const statusIcon = h.status === 'success' ? '&#10003;' : '&#10007;';
      const statusColor = h.status === 'success' ? '#a6e3a1' : '#f38ba8';
      const promptShort = h.prompt.length > 60 ? h.prompt.substring(0, 60) + '...' : h.prompt;
      const fileLabel = h.filename ? `<span style="color:#89b4fa;font-size:10px;">${h.filename}</span>` : '';
      return `<div style="display:flex;gap:6px;padding:4px 0;border-bottom:1px solid #313244;font-size:11px;${i === 0 ? 'background:#1e1e2e;' : ''}">
        <span style="color:${statusColor};font-weight:700;min-width:14px;">${statusIcon}</span>
        <span style="color:#6c7086;min-width:60px;">${time}</span>
        <span style="flex:1;color:#cdd6f4;word-break:break-all;">${promptShort}</span>
        ${fileLabel}
      </div>`;
    }).join('');
  }

  // ─── Logging ──────────────────────────────────────────────────────────────

  const logEl = () => document.getElementById('xb-log');

  function log(msg) {
    console.log(`[xBatcher] ${msg}`);
    const el = logEl();
    if (el) {
      el.textContent += `\n${msg}`;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  const PANEL_ID = 'xb-panel';
  const TRIGGER_ID = 'xb-trigger';

  function buildUI() {
    const trigger = document.createElement('div');
    trigger.id = TRIGGER_ID;
    trigger.innerHTML = 'xB';
    trigger.title = 'xBatcher';
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(PANEL_ID);
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    });
    document.body.appendChild(trigger);

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="xb-header">
        <span>xBatcher</span>
        <button id="xb-close" title="Close">&times;</button>
      </div>

      <label class="xb-label">Prompt</label>
      <div class="xb-row">
        <textarea id="xb-prompt" rows="4" placeholder="Paste your prompt here..."></textarea>
      </div>
      <button id="xb-paste" class="xb-btn xb-btn-sm">Paste from Clipboard</button>

      <label class="xb-label">UniqueID</label>
      <div class="xb-row">
        <input id="xb-uid" type="text" placeholder="Auto-generated UUID" />
        <button id="xb-gen-uid" class="xb-btn xb-btn-sm" title="Generate new UUID">&#x21bb;</button>
      </div>

      <label class="xb-label">Repeat Count</label>
      <input id="xb-count" type="number" min="1" value="1" />

      <label class="xb-label">Mode</label>
      <div class="xb-mode-group">
        <label><input type="radio" name="xb-mode" value="iteration" checked /> Iterations (same chat)</label>
        <label><input type="radio" name="xb-mode" value="unique" /> Unique (new chat each)</label>
      </div>

      <label class="xb-label">Delay (sec)</label>
      <input id="xb-delay" type="number" min="1" value="3" />

      <div class="xb-actions">
        <button id="xb-start" class="xb-btn xb-btn-primary">Start</button>
        <button id="xb-stop" class="xb-btn xb-btn-danger" disabled>Stop</button>
      </div>

      <label class="xb-label">Log</label>
      <textarea id="xb-log" rows="4" readonly></textarea>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <label class="xb-label" style="margin-top:0;">Prompt History</label>
        <button id="xb-clear-history" class="xb-btn xb-btn-sm">Clear</button>
      </div>
      <div id="xb-history" style="max-height:200px;overflow-y:auto;margin-top:4px;"></div>
    `;
    document.body.appendChild(panel);

    // Wire up events
    document.getElementById('xb-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    document.getElementById('xb-gen-uid').addEventListener('click', () => {
      document.getElementById('xb-uid').value = generateUUID();
    });

    document.getElementById('xb-paste').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        document.getElementById('xb-prompt').value = text;
      } catch (e) {
        log('Clipboard read failed: ' + e.message);
      }
    });

    document.getElementById('xb-start').addEventListener('click', onStart);
    document.getElementById('xb-stop').addEventListener('click', onStop);
    document.getElementById('xb-clear-history').addEventListener('click', () => {
      history = [];
      renderHistory();
      log('History cleared');
    });

    renderHistory();
  }

  // ─── Batch Logic ──────────────────────────────────────────────────────────

  async function onStart() {
    const promptText = document.getElementById('xb-prompt').value.trim();
    if (!promptText) {
      log('ERROR: Prompt is empty');
      return;
    }

    let uid = document.getElementById('xb-uid').value.trim();
    if (!uid) {
      uid = generateUUID();
      document.getElementById('xb-uid').value = uid;
    }

    const count = Math.max(1, parseInt(document.getElementById('xb-count').value, 10) || 1);
    const delay = Math.max(1, parseInt(document.getElementById('xb-delay').value, 10) || 3) * 1000;
    const mode = document.querySelector('input[name="xb-mode"]:checked').value;
    const isIteration = mode === 'iteration';

    running = true;
    abortFlag = false;
    setButtons(true);
    log(`Starting batch: ${count}x mode=${mode} uid=${uid}`);

    let seqNum = 1;

    try {
      for (let i = 0; i < count; i++) {
        if (abortFlag) {
          log('Aborted by user');
          break;
        }

        log(`── Run ${i + 1}/${count} ──`);

        if (!isIteration && i > 0) {
          log('Starting new chat...');
          await startNewChat();
          await sleep(1000);
        }

        const previousImg = getLatestImage();
        const previousSrc = previousImg?.src || null;

        log('Injecting prompt...');
        injectPrompt(promptText);
        await sleep(500);

        log('Submitting...');
        await clickSubmit();

        log('Waiting for new image...');
        const modeTag = isIteration ? 'ITER' : 'NEW';
        try {
          const newImg = await waitForNewImage(previousSrc, 120000);
          log('New image detected');
          await sleep(1000);

          const src = newImg.src;
          await newImg.decode().catch(() => {});
          const blob = await fetchImageBlob(src);
          const ext = getExtension(blob);
          const filename = `${uid}-${String(seqNum).padStart(3, '0')}-${modeTag}.${ext}`;
          downloadBlob(blob, filename);
          log(`Saved: ${filename}`);
          addHistoryEntry({ prompt: promptText, timestamp: Date.now(), status: 'success', filename });
        } catch (e) {
          log(`ERROR: ${e.message}`);
          addHistoryEntry({ prompt: promptText, timestamp: Date.now(), status: 'error', filename: null });
        }

        seqNum++;

        if (i < count - 1) {
          log(`Waiting ${delay / 1000}s...`);
          await sleep(delay);
        }
      }

      log('Batch complete!');
    } catch (e) {
      log(`FATAL ERROR: ${e.message}`);
      console.error('[xBatcher]', e);
    } finally {
      running = false;
      setButtons(false);
    }
  }

  function onStop() {
    abortFlag = true;
    log('Stop requested...');
  }

  function setButtons(isRunning) {
    document.getElementById('xb-start').disabled = isRunning;
    document.getElementById('xb-stop').disabled = !isRunning;
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  function injectStyles() {
    GM_addStyle(`
      #${TRIGGER_ID} {
        position: fixed;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        background: #6366f1;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        user-select: none;
        transition: background 0.2s;
      }
      #${TRIGGER_ID}:hover {
        background: #4f46e5;
      }

      #${PANEL_ID} {
        position: fixed;
        right: 76px;
        top: 50%;
        transform: translateY(-50%);
        width: 380px;
        max-height: 90vh;
        overflow-y: auto;
        background: #1e1e2e;
        color: #cdd6f4;
        border: 1px solid #45475a;
        border-radius: 12px;
        padding: 16px;
        z-index: 99998;
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        flex-direction: column;
        gap: 6px;
      }

      .xb-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 600;
      }
      .xb-header button {
        background: none;
        border: none;
        color: #cdd6f4;
        font-size: 20px;
        cursor: pointer;
      }

      .xb-label {
        display: block;
        margin-top: 8px;
        margin-bottom: 2px;
        font-size: 11px;
        text-transform: uppercase;
        color: #a6adc8;
        font-weight: 600;
      }

      .xb-row {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .xb-row input,
      .xb-row textarea {
        flex: 1;
      }

      #${PANEL_ID} textarea,
      #${PANEL_ID} input[type="text"],
      #${PANEL_ID} input[type="number"] {
        width: 100%;
        box-sizing: border-box;
        background: #313244;
        color: #cdd6f4;
        border: 1px solid #45475a;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
      }
      #${PANEL_ID} textarea:focus,
      #${PANEL_ID} input:focus {
        outline: none;
        border-color: #6366f1;
      }

      #xb-prompt {
        min-height: 72px;
      }

      #xb-log {
        min-height: 80px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        color: #a6adc8;
        background: #181825;
      }

      .xb-btn {
        padding: 6px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: opacity 0.2s;
      }
      .xb-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .xb-btn-sm {
        padding: 4px 10px;
        font-size: 11px;
        background: #45475a;
        color: #cdd6f4;
      }
      .xb-btn-primary {
        background: #6366f1;
        color: #fff;
      }
      .xb-btn-primary:hover:not(:disabled) {
        background: #4f46e5;
      }
      .xb-btn-danger {
        background: #f38ba8;
        color: #1e1e2e;
      }
      .xb-btn-danger:hover:not(:disabled) {
        background: #eb6f92;
      }

      .xb-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .xb-mode-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .xb-mode-group label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        cursor: pointer;
      }
      .xb-mode-group input[type="radio"] {
        accent-color: #6366f1;
      }
    `);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    injectStyles();
    buildUI();
    console.log('[xBatcher] Loaded v1.1.0');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }
})();
