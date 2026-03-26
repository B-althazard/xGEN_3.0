import { getState, setBridgeDetected, setJobState, addGeneratedImage, addBatchHistoryEntry, setBatchRunning } from './store.js';
import { saveImage } from './storageManager.js';
import { showBridgeInstall } from './components/bridgeInstall.js';

let timeoutId = null;
let timerId = null;
let batchMode = false;
let batchResolve = null;
let timeoutHandler = null;

function captureGenerationMeta(state) {
  return {
    characterType: state.characterType,
    promptOrder: state.settings.promptOrder,
    aesthetic: state.settings.aesthetic,
    selectedModel: state.settings.selectedModel,
    aspectRatio: state.settings.defaultAspectRatio,
    isMultiDummy: state.dummies.length > 1,
    dummyCount: state.dummies.length,
    activeDummyIndex: state.activeDummyIndex,
    fieldsSnapshot: JSON.parse(JSON.stringify(state.dummies[state.activeDummyIndex]?.fields || {})),
  };
}

function buildGenerationPayload(prompt, state) {
  return {
    nonce: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    ts: Date.now(),
    prompt,
    negativePrompt: state.promptResult?.negativePrompt || '',
    settings: {
      model: state.settings.selectedModel,
      aspectRatio: state.settings.defaultAspectRatio,
      cfgScale: 7,
      steps: 20,
    },
    meta: captureGenerationMeta(state),
  };
}

function scheduleTimeout(seconds = 120, onTimeout) {
  timeoutHandler = onTimeout;
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    clearLoader();
    timeoutHandler?.();
  }, seconds * 1000);
}

function startLoaderCountdown(seconds = 120, onTimeout) {
  renderLoader(seconds);
  let remaining = seconds;
  timerId = setInterval(() => {
    remaining -= 1;
    const node = document.querySelector('[data-countdown]');
    if (node) node.textContent = `${remaining}s`;
    if (remaining <= 0) clearInterval(timerId);
  }, 1000);
  scheduleTimeout(seconds, onTimeout);
}

function bumpGenerationTimeout(seconds = 120) {
  if (!timeoutHandler) return;
  scheduleTimeout(seconds, timeoutHandler);
}

function dispatchGeneration(payload, { onTimeout } = {}) {
  setJobState({
    currentJobStatus: 'sent',
    currentJobNonce: payload.nonce,
    generationStartTime: Date.now(),
    errorMessage: null,
  });
  startLoaderCountdown(120, onTimeout || (() => {
    setJobState({ currentJobStatus: 'failed', errorMessage: 'Generation timed out after 120 seconds.' });
  }));
  window.dispatchEvent(new CustomEvent('xgen:generate', { detail: payload }));
}

function renderLoader(seconds = 120) {
  const overlay = document.getElementById('gen-loading-overlay');
  overlay.hidden = false;
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loader">
      <div class="section__label">xGEN</div>
      <h2 style="margin-bottom:var(--sp-4);">Generating...</h2>
      <div class="dots"><span></span><span></span><span></span></div>
      <p class="loader__text">Time remaining: <strong data-countdown>${seconds}s</strong></p>
      <button class="btn" style="margin-top:var(--sp-4);" data-cancel-gen>Cancel</button>
    </div>
  `;
  overlay.querySelector('[data-cancel-gen]').onclick = clearLoader;
}

function clearLoader() {
  clearTimeout(timeoutId);
  clearInterval(timerId);
  timeoutHandler = null;
  const overlay = document.getElementById('gen-loading-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
}

export function initializeBridgeManager() {
  window.addEventListener('xgen:bridge-ready', () => setBridgeDetected(true));
  window.addEventListener('xgen:status-update', (event) => {
    const status = event.detail?.status || 'idle';
    if (['received from x.GEN', 'filling Venice', 'waiting for submit enable', 'submitting', 'submitted', 'waiting for image', 'extracting image', 'resuming image transfer'].includes(status)) {
      bumpGenerationTimeout(120);
    }
    setJobState({ currentJobStatus: status });
  });
  window.addEventListener('xgen:generation-error', (event) => {
    clearLoader();
    const msg = event.detail?.message || 'Generation failed';
    setJobState({ currentJobStatus: 'failed', errorMessage: msg });

    if (batchMode) {
      if (batchResolve) {
        const resolve = batchResolve;
        batchResolve = null;
        resolve({ success: false, error: msg });
      }
    }
  });
  window.addEventListener('xgen:image-received', async (event) => {
    clearLoader();
    const payload = event.detail;
    const currentState = getState();
    const image = {
      nonce: payload.nonce,
      ts: payload.ts || Date.now(),
      dataUrl: payload.dataUrl,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      model: payload.model,
      meta: payload.meta || null,
      width: payload.width,
      height: payload.height,
      mime: payload.mime || 'image/png',
      size: payload.size || 0,
      generationTime: payload.generationTime || 0,
      fields: JSON.parse(JSON.stringify(payload.meta?.fieldsSnapshot || currentState.dummies[currentState.activeDummyIndex]?.fields || {})),
    };
    await saveImage(image);
    await addGeneratedImage(image);
    setJobState({ currentJobStatus: 'done', currentJobNonce: payload.nonce, errorMessage: null });

    if (batchMode) {
      addBatchHistoryEntry({
        prompt: payload.prompt || '',
        timestamp: Date.now(),
        status: 'success',
        filename: `xgen-${payload.nonce}.png`,
      });
      if (batchResolve) {
        const resolve = batchResolve;
        batchResolve = null;
        resolve({ success: true, image });
      }
    } else {
      window.location.hash = '#xgen';
    }
  });
}

export function triggerGeneration() {
  const state = getState();
  if (!state.app.bridgeDetected) {
    showBridgeInstall();
    return;
  }
  if (!state.app.isOnline) {
    setJobState({ currentJobStatus: 'failed', errorMessage: 'You are offline. Generation requires a connection.' });
    return;
  }
  const payload = buildGenerationPayload(state.promptResult?.positivePrompt || '', state);
  dispatchGeneration(payload);
}

// ─── xBatcher Batch Orchestration ──────────────────────────────────────────

function sendSingleGeneration(promptText) {
  const state = getState();
  const payload = buildGenerationPayload(promptText, state);
  dispatchGeneration(payload, {
    onTimeout: () => {
      if (batchMode && batchResolve) {
        const resolve = batchResolve;
        batchResolve = null;
        resolve({ success: false, error: 'Timeout' });
      } else {
        setJobState({ currentJobStatus: 'failed', errorMessage: 'Generation timed out after 120 seconds.' });
      }
    },
  });
}

function waitForGenerationResult() {
  return new Promise((resolve) => {
    batchResolve = resolve;
  });
}

export async function startBatchJob() {
  const state = getState();
  if (!state.app.bridgeDetected) {
    showBridgeInstall();
    return;
  }
  if (!state.app.isOnline) {
    setJobState({ currentJobStatus: 'failed', errorMessage: 'You are offline.' });
    return;
  }
  if (state.batch.promptList.length === 0) {
    return;
  }

  batchMode = true;
  setBatchRunning(true);

  const { promptList, repeatCount, delay } = state.batch;
  const delayMs = Math.max(1, delay) * 1000;
  let totalRuns = 0;
  const totalExpected = promptList.length * Math.max(1, repeatCount);

  try {
    for (let pIdx = 0; pIdx < promptList.length; pIdx++) {
      if (!getState().batch.running) break;
      const promptItem = promptList[pIdx];

      for (let r = 0; r < repeatCount; r++) {
        if (!getState().batch.running) break;
        totalRuns++;

        sendSingleGeneration(promptItem.text);
        const result = await waitForGenerationResult();

        if (!result.success) {
          addBatchHistoryEntry({
            prompt: promptItem.text,
            timestamp: Date.now(),
            status: 'error',
            filename: null,
          });
        }

        if (totalRuns < totalExpected && getState().batch.running) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
  } finally {
    batchMode = false;
    batchResolve = null;
    setBatchRunning(false);
    clearLoader();
    window.location.hash = '#xgen';
  }
}

export function stopBatchJob() {
  setBatchRunning(false);
  if (batchMode) {
    clearLoader();
    batchMode = false;
    if (batchResolve) {
      const resolve = batchResolve;
      batchResolve = null;
      resolve({ success: false, error: 'Aborted' });
    }
  }
}
