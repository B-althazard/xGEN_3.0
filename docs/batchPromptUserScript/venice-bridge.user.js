// ==UserScript==
// @name         Replic.a.i ↔ Venice Bridge
// @namespace    https://replic.ai
// @version      1.0.0
// @description  Bridges Replic.a.i to Venice.ai for automated image generation
// @author       Replic.a.i
// @match        https://replic.ai/*
// @match        https://b-althazard.github.io/Replic.a.i/*
// @match        https://venice.ai/chat/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const BRIDGE_KEYS = {
    REQUEST: 'replic_v1_request',
    REQUEST_NONCE: 'replic_v1_request_nonce',
    RESULT: 'replic_v1_result',
    RESULT_NONCE: 'replic_v1_result_nonce',
    STATUS: 'replic_v1_status',
    ERROR: 'replic_v1_error',
  };

  const VENICE_SELECTORS = {
    promptTextarea: 'textarea[name="prompt-textarea"]',
    submitButton: 'button[type="submit"][aria-label="Submit chat"]',
    imageOutput: '.image-message img, [data-testid="image-message"] img, img[src*="venice"]',
  };

  const isReplic = window.location.hostname === 'replic.ai'
    || window.location.href.includes('b-althazard.github.io/Replic.a.i');
  const isVenice = window.location.hostname === 'venice.ai';

  if (isReplic) {
    initReplicSide();
  }

  if (isVenice) {
    initVeniceSide();
  }

  function initReplicSide() {
    window.dispatchEvent(new CustomEvent('replic:bridge-ready'));

    GM_addValueChangeListener(BRIDGE_KEYS.RESULT_NONCE, (_k, _o, _n, remote) => {
      if (!remote) return;
      const payload = GM_getValue(BRIDGE_KEYS.RESULT, null);
      if (!payload) return;
      window.dispatchEvent(new CustomEvent('replic:image-received', { detail: payload }));
    });

    GM_addValueChangeListener(BRIDGE_KEYS.STATUS, (_k, _o, newVal, remote) => {
      if (!remote) return;
      window.dispatchEvent(new CustomEvent('replic:status-update', { detail: newVal }));
    });

    GM_addValueChangeListener(BRIDGE_KEYS.ERROR, (_k, _o, newVal, remote) => {
      if (!remote) return;
      window.dispatchEvent(new CustomEvent('replic:generation-error', { detail: newVal }));
    });

    window.addEventListener('replic:generate', (e) => {
      const payload = e.detail;
      GM_setValue(BRIDGE_KEYS.REQUEST, payload);
      GM_setValue(BRIDGE_KEYS.REQUEST_NONCE, `${payload.nonce}_${Date.now()}`);
    });

    console.log('[Replic Bridge] Ready on Replic.a.i side');
  }

  function initVeniceSide() {
    let listenerId = null;

    listenerId = GM_addValueChangeListener(BRIDGE_KEYS.REQUEST_NONCE, async (_k, _o, _n, remote) => {
      if (!remote) return;
      const requestPayload = GM_getValue(BRIDGE_KEYS.REQUEST, null);
      if (!requestPayload) return;

      try {
        await runVeniceJob(requestPayload);
      } catch (error) {
        console.error('[Replic Bridge] Job failed:', error);
        GM_setValue(BRIDGE_KEYS.ERROR, {
          nonce: requestPayload.nonce,
          ts: Date.now(),
          message: String(error),
        });
        GM_setValue(BRIDGE_KEYS.STATUS, { nonce: requestPayload.nonce, status: 'failed' });
      }
    });

    console.log('[Replic Bridge] Ready on Venice.ai side');
  }

  async function runVeniceJob(requestPayload) {
    const startTime = Date.now();

    GM_setValue(BRIDGE_KEYS.STATUS, { nonce: requestPayload.nonce, status: 'received' });

    const previousImg = getLatestVeniceImage();
    const previousSrc = previousImg?.src || null;

    await sleep(500);

    await fillVenicePrompt(requestPayload.prompt);
    await sleep(250);

    await clickVeniceSubmit();

    GM_setValue(BRIDGE_KEYS.STATUS, { nonce: requestPayload.nonce, status: 'generating' });

    await waitForNewImage(previousSrc, 120000);

    const result = await extractImage(requestPayload);
    result.generationTime = Date.now() - startTime;

    publishResult(result);
    GM_setValue(BRIDGE_KEYS.STATUS, { nonce: requestPayload.nonce, status: 'done' });
  }

  function getLatestVeniceImage() {
    const imgs = document.querySelectorAll(VENICE_SELECTORS.imageOutput);
    return imgs[imgs.length - 1] || null;
  }

  function setNativeValue(element, value) {
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

  async function fillVenicePrompt(prompt) {
    const textarea = document.querySelector(VENICE_SELECTORS.promptTextarea);
    if (!textarea) throw new Error('Venice prompt textarea not found');
    setNativeValue(textarea, prompt);
  }

  async function clickVeniceSubmit() {
    const btn = document.querySelector(VENICE_SELECTORS.submitButton);
    if (!btn) throw new Error('Venice submit button not found');
    if (btn.disabled) {
      await waitForCondition(() => !btn.disabled, 3000);
    }
    btn.click();
  }

  async function waitForNewImage(previousSrc, timeout = 120000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver(() => {
        const latest = getLatestVeniceImage();
        if (latest && latest.src && latest.src !== previousSrc && !latest.src.startsWith('data:')) {
          observer.disconnect();
          resolve(latest);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, attributes: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout: no new Venice image after 120s'));
      }, timeout);
    });
  }

  async function extractImage(requestPayload) {
    const img = getLatestVeniceImage();
    if (!img) throw new Error('No Venice image found after waiting');

    await img.decode().catch(() => {});

    const response = await fetch(img.src);
    const blob = await response.blob();
    const dataUrl = await blobToDataURL(blob);

    return {
      nonce: requestPayload.nonce,
      ts: Date.now(),
      prompt: requestPayload.prompt,
      negativePrompt: requestPayload.negativePrompt || '',
      mime: blob.type,
      size: blob.size,
      width: img.naturalWidth,
      height: img.naturalHeight,
      model: requestPayload.settings?.model || 'unknown',
      dataUrl,
    };
  }

  async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function publishResult(result) {
    GM_setValue(BRIDGE_KEYS.RESULT, result);
    GM_setValue(BRIDGE_KEYS.RESULT_NONCE, result.nonce);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForCondition(conditionFn, timeout) {
    const start = Date.now();
    while (!conditionFn()) {
      if (Date.now() - start > timeout) {
        throw new Error('Condition timeout');
      }
      await sleep(100);
    }
  }
})();
