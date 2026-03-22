// ==UserScript==
// @name         x.GEN → Venice Bridge
// @namespace    https://b-althazard.github.io/
// @version      2.0.1
// @description  Bridges x.GEN to Venice.ai for automated image generation
// @match        https://b-althazard.github.io/xgen/*
// @match        https://b-althazard.github.io/xGEN/*
// @match        https://venice.ai/chat*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const XGEN_URL_RE = /^https:\/\/b-althazard\.github\.io\/xgen\//i;
  const VENICE_HOST = 'venice.ai';

  const KEYS = {
    REQUEST: 'xgen_v1_request',
    REQUEST_NONCE: 'xgen_v1_request_nonce',
    RESULT: 'xgen_v1_result',
    RESULT_NONCE: 'xgen_v1_result_nonce',
    STATUS: 'xgen_v1_status',
    ERROR: 'xgen_v1_error',
    TIMESTAMP: 'xgen_v1_timestamp',
    LOG_NONCE: 'xgen_v1_log_nonce',
    LAST_LOG: 'xgen_v1_last_log',
    LAST_PROCESSED_NONCE: 'xgen_v1_last_processed_nonce',
    HEARTBEAT_XGEN: 'xgen_v1_heartbeat_xgen',
    HEARTBEAT_VENICE: 'xgen_v1_heartbeat_venice',
    LAST_TRANSFER_TS: 'xgen_v1_last_transfer_ts',
  };

  const SELECTORS = {
    xgenGenerate: '#lab-generate-btn',
    xgenPrompt: '#prompter-positive',

    veniceTextarea: 'textarea[name="prompt-textarea"]',
    veniceSubmit: 'button[type="submit"][aria-label="Submit chat"]',
    veniceUserMessage: '[data-testid="user-message"]',
    veniceImage: '.image-message img'
  };

  const VERIFIED_SELECTORS = {
    desktop: {
      veniceTextarea: 'textarea[name="prompt-textarea"]',
      veniceSubmit: 'button[type="submit"][aria-label="Submit chat"]',
      veniceUserMessage: '[data-testid="user-message"]',
      veniceImage: '.image-message img'
    },
    mobile: {
      veniceTextarea: 'textarea[name="prompt-textarea"]',
      veniceSubmit: 'button[type="submit"][aria-label="Submit chat"]',
      veniceUserMessage: '[data-testid="user-message"]',
      veniceImage: '.image-message img'
    }
  };

  const CONFIG = {
    maxLogs: 150,
    submitWaitMs: 10000,
    textareaWaitMs: 20000,
    imageWaitMs: 120000,
    historyLimit: 24,
    pendingFreshMs: 5 * 60 * 1000,
    heartbeatMs: 1500,
    connectionFreshMs: 4500,
    greenHoldMs: 12000,
    clickDelayMs: 50,
    pillId: 'rvpb-pill',
    panelId: 'rvpb-panel',
    styleId: 'rvpb-style'
  };

  const bridgeState = {
    role: 'unknown',
    status: 'idle',
    statusDetail: '',
    signal: 'red',
    lastPrompt: '',
    panelOpen: false,
    logs: [],
    lastProcessedNonceLocal: null
  };

  function isXgen() {
    return XGEN_URL_RE.test(window.location.href);
  }

  function isVenice() {
    return window.location.hostname.includes(VENICE_HOST);
  }

  function isVeniceActivePage() {
    return isVenice() && document.visibilityState === 'visible';
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForElement(selector, timeoutMs = 15000, intervalMs = 150) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(intervalMs);
    }
    return null;
  }

  function makeNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function truncate(text, max = 120) {
    if (typeof text !== 'string') return String(text || '');
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  function escHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatLogData(data) {
    if (!data || typeof data !== 'object') return String(data || '');
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  function otherHeartbeatKey() {
    return isXgen() ? KEYS.HEARTBEAT_VENICE : KEYS.HEARTBEAT_XGEN;
  }

  function ownHeartbeatKey() {
    return isXgen() ? KEYS.HEARTBEAT_XGEN : KEYS.HEARTBEAT_VENICE;
  }

  function dispatchPageEvent(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function computeSignal(localStatus = bridgeState.status) {
    const now = Date.now();
    const otherTs = Number(GM_getValue(otherHeartbeatKey(), 0) || 0);
    const transferTs = Number(GM_getValue(KEYS.LAST_TRANSFER_TS, 0) || 0);
    const connected = !!otherTs && (now - otherTs) <= CONFIG.connectionFreshMs;
    const transferredRecently = !!transferTs && (now - transferTs) <= CONFIG.greenHoldMs;

    if (/error|timeout|failed|missing|empty|selector check failed/i.test(localStatus)) return 'all-red';
    if (transferredRecently) return 'green';
    if (connected) return 'orange';
    return 'red';
  }

  function injectStyles() {
    if (document.getElementById(CONFIG.styleId)) return;

    const style = document.createElement('style');
    style.id = CONFIG.styleId;
    style.textContent = `
      #${CONFIG.pillId} {
        position: fixed;
        left: 50%;
        top: 1vh;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-width: 106px;
        height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        background: rgba(0,0,0,0.92);
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        cursor: pointer;
        user-select: none;
      }
      #${CONFIG.pillId} .rvpb-light {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        opacity: 0.22;
        background: #444;
        transition: opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease;
      }
      #${CONFIG.pillId} .rvpb-light.active { opacity: 1; transform: scale(1.08); }
      #${CONFIG.pillId} .rvpb-light.error.active { background: #ff3b30; box-shadow: 0 0 10px rgba(255,59,48,0.95); }
      #${CONFIG.pillId} .rvpb-light.red.active { background: #ff3b30; box-shadow: 0 0 10px rgba(255,59,48,0.95); }
      #${CONFIG.pillId} .rvpb-light.orange.active { background: #ff9f0a; box-shadow: 0 0 10px rgba(255,159,10,0.95); }
      #${CONFIG.pillId} .rvpb-light.green.active { background: #30d158; box-shadow: 0 0 10px rgba(48,209,88,0.95); }
      #${CONFIG.pillId} .rvpb-label {
        color: rgba(255,255,255,0.92);
        font: 600 12px/1.2 system-ui, sans-serif;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      #${CONFIG.panelId} {
        position: fixed;
        left: 50%;
        top: calc(1vh + 52px);
        transform: translateX(-50%);
        z-index: 2147483646;
        width: min(92vw, 560px);
        max-height: 48vh;
        overflow: auto;
        border-radius: 16px;
        padding: 14px;
        background: rgba(8,8,8,0.74);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 10px 34px rgba(0,0,0,0.30);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #f3f3f3;
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      #${CONFIG.panelId}[hidden] { display:none !important; }
      #${CONFIG.panelId} .rvpb-title { font-weight: 700; margin-bottom: 10px; }
      #${CONFIG.panelId} .rvpb-grid {
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 6px 10px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255,255,255,0.05);
        margin-bottom: 12px;
      }
      #${CONFIG.panelId} .rvpb-k { color: rgba(255,255,255,0.60); }
      #${CONFIG.panelId} .rvpb-v { color: rgba(255,255,255,0.92); white-space: pre-wrap; word-break: break-word; }
      #${CONFIG.panelId} .rvpb-log { display:flex; flex-direction:column; gap:8px; }
      #${CONFIG.panelId} .rvpb-item {
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(255,255,255,0.05);
      }
      #${CONFIG.panelId} .rvpb-item-top {
        display:flex; justify-content:space-between; gap:12px; margin-bottom:3px;
      }
      #${CONFIG.panelId} .rvpb-type { font-weight:700; color:#fff; }
      #${CONFIG.panelId} .rvpb-time { color:rgba(255,255,255,0.62); white-space:nowrap; }
    `;
    document.documentElement.appendChild(style);
  }

  function ensurePill() {
    let pill = document.getElementById(CONFIG.pillId);
    if (pill) return pill;

    injectStyles();

    pill = document.createElement('div');
    pill.id = CONFIG.pillId;
    pill.innerHTML = `
      <div class="rvpb-light red" data-light="red"></div>
      <div class="rvpb-light orange" data-light="orange"></div>
      <div class="rvpb-light green" data-light="green"></div>
      <div class="rvpb-label">Bridge</div>
    `;
    pill.addEventListener('click', togglePanel);
    document.documentElement.appendChild(pill);
    return pill;
  }

  function ensurePanel() {
    let panel = document.getElementById(CONFIG.panelId);
    if (panel) return panel;

    injectStyles();

    panel = document.createElement('div');
    panel.id = CONFIG.panelId;
    panel.hidden = true;
    document.documentElement.appendChild(panel);
    renderPanel();
    return panel;
  }

  function updatePill() {
    const pill = ensurePill();
    const red = pill.querySelector('.red');
    const orange = pill.querySelector('.orange');
    const green = pill.querySelector('.green');

    [red, orange, green].forEach(light => {
      light.classList.remove('active', 'error');
    });

    bridgeState.signal = computeSignal();
    if (bridgeState.signal === 'all-red') {
      [red, orange, green].forEach(light => light.classList.add('active', 'error'));
    } else if (bridgeState.signal === 'red') {
      red.classList.add('active');
    } else if (bridgeState.signal === 'orange') {
      orange.classList.add('active');
    } else {
      green.classList.add('active');
    }

    if (bridgeState.panelOpen) renderPanel();
  }

  function renderPanel() {
    const panel = ensurePanel();
    const recent = bridgeState.logs.slice(-CONFIG.historyLimit).reverse();
    const items = recent.map(entry => `
      <div class="rvpb-item">
        <div class="rvpb-item-top">
          <div class="rvpb-type">${escHtml(entry.type)}</div>
          <div class="rvpb-time">${escHtml(entry.ts)}</div>
        </div>
        <div>${escHtml(formatLogData(entry.data))}</div>
      </div>
    `).join('');

    panel.innerHTML = `
      <div class="rvpb-title">Bridge Status</div>
      <div class="rvpb-grid">
        <div class="rvpb-k">Role</div><div class="rvpb-v">${escHtml(bridgeState.role)}</div>
        <div class="rvpb-k">Signal</div><div class="rvpb-v">${escHtml(bridgeState.signal)}</div>
        <div class="rvpb-k">Status</div><div class="rvpb-v">${escHtml(bridgeState.status)}</div>
        <div class="rvpb-k">Detail</div><div class="rvpb-v">${escHtml(bridgeState.statusDetail || '')}</div>
        <div class="rvpb-k">Prompt</div><div class="rvpb-v">${escHtml(truncate(bridgeState.lastPrompt || '', 220))}</div>
      </div>
      <div class="rvpb-log">
        ${items || '<div class="rvpb-item">No history yet.</div>'}
      </div>
    `;
  }

  function togglePanel() {
    const panel = ensurePanel();
    bridgeState.panelOpen = !bridgeState.panelOpen;
    panel.hidden = !bridgeState.panelOpen;
    if (bridgeState.panelOpen) renderPanel();
  }

  function log(type, data = {}, skipBroadcast = false) {
    const entry = { ts: nowIso(), role: bridgeState.role, type, data };
    bridgeState.logs.push(entry);
    if (bridgeState.logs.length > CONFIG.maxLogs) bridgeState.logs.shift();
    console.log('[xGEN→Venice]', entry.ts, `[${entry.role}]`, type, data);
    if (bridgeState.panelOpen) renderPanel();
    if (!skipBroadcast) {
      GM_setValue(KEYS.LAST_LOG, entry);
      GM_setValue(KEYS.LOG_NONCE, makeNonce());
    }
  }

  function setStatus(status, detail = '') {
    bridgeState.status = status;
    bridgeState.statusDetail = detail;
    updatePill();
    log('status', { status, detail }, true);
    GM_setValue(KEYS.STATUS, {
      role: bridgeState.role,
      status,
      detail,
      ts: Date.now(),
      href: location.href
    });

    if (isXgen()) {
      dispatchPageEvent('xgen:status-update', {
        role: bridgeState.role,
        status,
        detail,
        connected: computeSignal(status) !== 'red'
      });
    }
  }

  function startHeartbeat() {
    const write = () => {
      GM_setValue(ownHeartbeatKey(), Date.now());
      if (isXgen()) {
        dispatchPageEvent('xgen:bridge-ready', { source: 'userscript-heartbeat' });
      }
      updatePill();
    };
    write();
    setInterval(write, CONFIG.heartbeatMs);
  }

  function setNativeValue(element, value) {
    const proto = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    const setter = descriptor && descriptor.set;
    if (setter) setter.call(element, value);
    else element.value = value;
  }

  function dispatchInputSequence(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
  }

  function getLatestVeniceImageSrc() {
    const images = Array.from(document.querySelectorAll(SELECTORS.veniceImage));
    if (!images.length) return '';
    const last = images[images.length - 1];
    return last?.src || '';
  }

  async function waitForNewVeniceImage(previousSrc) {
    const start = Date.now();
    while (Date.now() - start < CONFIG.imageWaitMs) {
      const images = Array.from(document.querySelectorAll(SELECTORS.veniceImage));
      const last = images[images.length - 1];
      if (last && last.src && last.src !== previousSrc && last.complete) {
        return last;
      }
      await sleep(500);
    }
    return null;
  }

  async function imageElementToDataUrl(img) {
    const src = img?.currentSrc || img?.src;
    if (!src) throw new Error('image src missing');
    const response = await fetch(src);
    if (!response.ok) throw new Error(`image fetch failed: ${response.status}`);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  }

  async function waitForVeniceImageDataUrl(previousSrc, nonce) {
    setStatus('waiting for image');
    const img = await waitForNewVeniceImage(previousSrc);
    if (!img) {
      setStatus('image transfer failed', 'no image found');
      log('venice_image_missing', { nonce, timeoutMs: CONFIG.imageWaitMs });
      return null;
    }

    setStatus('extracting image');
    try {
      const dataUrl = await imageElementToDataUrl(img);
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        throw new Error('invalid data URL');
      }
      log('venice_image_extracted', { nonce, src: img.src, width: img.naturalWidth || null, height: img.naturalHeight || null, length: dataUrl.length });
      return dataUrl;
    } catch (err) {
      setStatus('image transfer failed', String(err));
      log('venice_image_extract_failed', { nonce, message: String(err) });
      return null;
    }
  }

  async function captureXgenPrompt(payload = null) {
    const prompt = payload?.prompt || (document.querySelector(SELECTORS.xgenPrompt)?.textContent || '').trim();
    if (!prompt) {
      setStatus('error: prompt empty');
      log('xgen_prompt_empty');
      dispatchPageEvent('xgen:generation-error', { message: 'Prompt is empty.' });
      return;
    }

    const nonce = payload?.nonce || makeNonce();
    bridgeState.lastPrompt = prompt;

    GM_setValue(KEYS.REQUEST, {
      prompt,
      negativePrompt: payload?.negativePrompt || '',
      settings: payload?.settings || null,
      nonce,
      ts: Date.now()
    });
    GM_setValue(KEYS.TIMESTAMP, Date.now());
    GM_setValue(KEYS.REQUEST_NONCE, nonce);

    setStatus('prompt captured', truncate(prompt, 100));
    log('prompt_sent', { nonce, length: prompt.length, preview: truncate(prompt, 100) });
  }

  function initXgen() {
    bridgeState.role = 'x.GEN';
    ensurePill();
    ensurePanel();
    setStatus('standby', 'Waiting for Generate click');
    dispatchPageEvent('xgen:bridge-ready', { source: 'userscript' });
    log('init', { href: location.href, verifiedSelectors: VERIFIED_SELECTORS });
    startHeartbeat();
    setTimeout(() => verifyVeniceSelectors(), 700);

    window.addEventListener('xgen:generate', (event) => {
      log('generate_clicked', { nonce: event.detail?.nonce || null });
      setStatus('standby', 'Generate clicked');

      setTimeout(() => {
        captureXgenPrompt(event.detail || null).catch(err => {
          setStatus('error: x.GEN handler failed', String(err));
          log('xgen_handler_error', { message: String(err) });
          dispatchPageEvent('xgen:generation-error', { message: String(err) });
        });
      }, CONFIG.clickDelayMs);
    });

    GM_addValueChangeListener(KEYS.STATUS, (_key, _oldValue, value, remote) => {
      if (!remote || !value || value.role === bridgeState.role) return;
      log('remote_status', value, true);
      updatePill();
      dispatchPageEvent('xgen:status-update', {
        ...value,
        connected: computeSignal(value.status) !== 'red'
      });

      if (/error|timeout|failed/i.test(value.status || '')) {
        dispatchPageEvent('xgen:generation-error', {
          message: value.detail || value.status || 'Venice generation failed.'
        });
      }
    });

    GM_addValueChangeListener(KEYS.LOG_NONCE, (_key, _oldValue, _value, remote) => {
      if (!remote) return;
      const lastLog = GM_getValue(KEYS.LAST_LOG, null);
      if (!lastLog || lastLog.role === bridgeState.role) return;
      bridgeState.logs.push(lastLog);
      if (bridgeState.logs.length > CONFIG.maxLogs) bridgeState.logs.shift();
      if (bridgeState.panelOpen) renderPanel();
    });

    GM_addValueChangeListener(KEYS.HEARTBEAT_VENICE, (_k, _o, _n, remote) => {
      if (!remote) return;
      updatePill();
    });

    GM_addValueChangeListener(KEYS.LAST_TRANSFER_TS, (_k, _o, _n, remote) => {
      if (!remote) return;
      updatePill();
    });

    GM_addValueChangeListener(KEYS.RESULT_NONCE, (_key, oldValue, newValue, remote) => {
      if (!remote || !newValue || newValue === oldValue) return;
      const result = GM_getValue(KEYS.RESULT, null);
      if (!result || !result.dataUrl) {
        setStatus('image transfer failed', 'image payload missing');
        log('xgen_image_payload_missing', { nonce: newValue });
        dispatchPageEvent('xgen:generation-error', { message: 'Image payload missing.' });
        return;
      }
      setStatus('image transferred');
      dispatchPageEvent('xgen:image-received', result);
    });
  }

  async function fillVenicePrompt(prompt) {
    setStatus('waiting for textarea');
    const textarea = await waitForElement(SELECTORS.veniceTextarea, CONFIG.textareaWaitMs);
    if (!textarea) {
      setStatus('error: textarea not found');
      log('venice_textarea_missing');
      return false;
    }

    setStatus('filling Venice', truncate(prompt, 100));
    textarea.focus();
    setNativeValue(textarea, prompt);
    dispatchInputSequence(textarea);
    await sleep(100);
    textarea.focus();
    dispatchInputSequence(textarea);

    bridgeState.lastPrompt = prompt;
    log('venice_prompt_inserted', { length: prompt.length, preview: truncate(prompt, 100) });
    return true;
  }

  async function clickVeniceSubmit() {
    setStatus('waiting for submit enable');
    const start = Date.now();
    while (Date.now() - start < CONFIG.submitWaitMs) {
      const submitBtn = document.querySelector(SELECTORS.veniceSubmit);
      if (submitBtn && !submitBtn.disabled) {
        const previousSrc = getLatestVeniceImageSrc();
        setStatus('submitting');
        submitBtn.click();
        setStatus('submitted');
        log('venice_submit_clicked', { previousSrc: previousSrc || null });
        updatePill();
        return previousSrc;
      }
      await sleep(150);
    }

    setStatus('timeout: submit not enabled');
    log('venice_submit_timeout', { timeoutMs: CONFIG.submitWaitMs });
    return null;
  }

  async function processIncomingPrompt(prompt, nonce, force = false) {
    const request = GM_getValue(KEYS.REQUEST, null);

    if (!prompt || !prompt.trim()) {
      setStatus('error: received empty prompt');
      log('received_empty_prompt');
      return;
    }

    if (!force) {
      const lastProcessedGlobal = GM_getValue(KEYS.LAST_PROCESSED_NONCE, null);
      if (nonce && (nonce === bridgeState.lastProcessedNonceLocal || nonce === lastProcessedGlobal)) {
        log('skip_duplicate_nonce', { nonce });
        return;
      }
    }

    bridgeState.lastPrompt = prompt;
    setStatus('received from x.GEN', truncate(prompt, 100));
    log('incoming_prompt', { nonce, length: prompt.length, preview: truncate(prompt, 100), force });

    const ok = await fillVenicePrompt(prompt);
    if (!ok) return;

    await sleep(250);
    const previousSrc = await clickVeniceSubmit();
    if (previousSrc === null) return;

    const dataUrl = await waitForVeniceImageDataUrl(previousSrc, nonce);
    if (!dataUrl) return;

    if (nonce) {
      bridgeState.lastProcessedNonceLocal = nonce;
      GM_setValue(KEYS.LAST_PROCESSED_NONCE, nonce);
       GM_setValue(KEYS.RESULT, {
         dataUrl,
         nonce,
         ts: Date.now(),
         prompt,
         negativePrompt: request?.negativePrompt || '',
         model: request?.settings?.model || null,
         settings: request?.settings || null
       });
       GM_setValue(KEYS.RESULT_NONCE, nonce);
     } else {
       GM_setValue(KEYS.RESULT, { dataUrl, ts: Date.now(), prompt });
       GM_setValue(KEYS.RESULT_NONCE, makeNonce());
     }
    GM_setValue(KEYS.LAST_TRANSFER_TS, Date.now());
    setStatus('image transferred');
    log('venice_image_sent', { nonce, length: dataUrl.length });
  }

  async function tryRecoverPendingPrompt(reason) {
    if (!isVeniceActivePage()) return;

    const request = GM_getValue(KEYS.REQUEST, null);
    const nonce = GM_getValue(KEYS.REQUEST_NONCE, null);
    const ts = GM_getValue(KEYS.TIMESTAMP, 0);
    const lastProcessedGlobal = GM_getValue(KEYS.LAST_PROCESSED_NONCE, null);

    if (!request || !request.prompt || !nonce || !ts) {
      log('recovery_no_pending_prompt', { reason });
      return;
    }

    if (Date.now() - ts > CONFIG.pendingFreshMs) {
      log('recovery_prompt_too_old', { reason, ageMs: Date.now() - ts });
      return;
    }

    if (nonce === bridgeState.lastProcessedNonceLocal || nonce === lastProcessedGlobal) {
      log('recovery_already_processed', { reason, nonce });
      return;
    }

    log('recovery_attempt', { reason, nonce });
    await processIncomingPrompt(request.prompt, nonce, false);
  }


  function verifyVeniceSelectors() {
    if (!isVenice()) return;
    const report = {
      textarea: !!document.querySelector(SELECTORS.veniceTextarea),
      submit: !!document.querySelector(SELECTORS.veniceSubmit),
      userMessage: !!document.querySelector(SELECTORS.veniceUserMessage),
      image: !!document.querySelector(SELECTORS.veniceImage)
    };
    log('selector_verification', report);
    const missing = Object.entries(report).filter(([, ok]) => !ok).map(([k]) => k);
    if (missing.length) setStatus('selector check failed', missing.join(', '));
  }

  function initVenice() {
    bridgeState.role = 'Venice.Ai';
    ensurePill();
    ensurePanel();
    setStatus('standby', 'Waiting for prompt from x.GEN');
    log('init', { href: location.href, verifiedSelectors: VERIFIED_SELECTORS });
    startHeartbeat();
    setTimeout(() => verifyVeniceSelectors(), 700);

    GM_addValueChangeListener(KEYS.REQUEST_NONCE, async (_key, oldValue, newValue, remote) => {
      if (!remote || !newValue || newValue === oldValue) return;
      const request = GM_getValue(KEYS.REQUEST, null);
      const prompt = request?.prompt || '';
      log('incoming_nonce', { nonce: newValue });
      try {
        await processIncomingPrompt(prompt, newValue, false);
      } catch (err) {
        setStatus('error: Venice handler failed', String(err));
        log('venice_processing_error', { message: String(err) });
      }
    });

    GM_addValueChangeListener(KEYS.STATUS, (_key, _oldValue, value, remote) => {
      if (!remote || !value || value.role === bridgeState.role) return;
      log('remote_status', value, true);
      updatePill();
    });

    GM_addValueChangeListener(KEYS.LOG_NONCE, (_key, _oldValue, _value, remote) => {
      if (!remote) return;
      const lastLog = GM_getValue(KEYS.LAST_LOG, null);
      if (!lastLog || lastLog.role === bridgeState.role) return;
      bridgeState.logs.push(lastLog);
      if (bridgeState.logs.length > CONFIG.maxLogs) bridgeState.logs.shift();
      if (bridgeState.panelOpen) renderPanel();
    });

    GM_addValueChangeListener(KEYS.HEARTBEAT_XGEN, (_k, _o, _n, remote) => {
      if (!remote) return;
      updatePill();
    });

    GM_addValueChangeListener(KEYS.LAST_TRANSFER_TS, (_k, _o, _n, remote) => {
      if (!remote) return;
      updatePill();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        tryRecoverPendingPrompt('visibilitychange').catch(err => {
          log('recovery_error', { reason: 'visibilitychange', message: String(err) });
        });
      }
    });

    window.addEventListener('focus', () => {
      tryRecoverPendingPrompt('focus').catch(err => {
        log('recovery_error', { reason: 'focus', message: String(err) });
      });
    });

    setTimeout(() => {
      tryRecoverPendingPrompt('init').catch(err => {
        log('recovery_error', { reason: 'init', message: String(err) });
      });
    }, 500);
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (isXgen()) initXgen();
        if (isVenice()) initVenice();
      });
    } else {
      if (isXgen()) initXgen();
      if (isVenice()) initVenice();
    }
  }

  boot();
})();
