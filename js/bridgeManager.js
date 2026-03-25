import { getState, setBridgeDetected, setJobState, addGeneratedImage, addBatchHistoryEntry, setBatchRunning, updatePromptInList } from './store.js';
import { saveImage } from './storageManager.js';
import { showBridgeInstall } from './components/bridgeInstall.js';

let timeoutId = null;
let timerId = null;
let batchMode = false;
let batchQueue = [];
let batchResolve = null;

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
  const overlay = document.getElementById('gen-loading-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
}

export function initializeBridgeManager() {
  window.addEventListener('xgen:bridge-ready', () => setBridgeDetected(true));
  window.addEventListener('xgen:status-update', (event) => setJobState({ currentJobStatus: event.detail?.status || 'idle' }));
  window.addEventListener('xgen:generation-error', (event) => {
    clearLoader();
    const msg = event.detail?.message || 'Generation failed';
    setJobState({ currentJobStatus: 'failed', errorMessage: msg });

    if (batchMode) {
      addBatchHistoryEntry({
        prompt: '',
        timestamp: Date.now(),
        status: 'error',
        filename: null,
      });
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
      width: payload.width,
      height: payload.height,
      mime: payload.mime || 'image/png',
      size: payload.size || 0,
      generationTime: payload.generationTime || 0,
      fields: JSON.parse(JSON.stringify(currentState.dummies[currentState.activeDummyIndex]?.fields || {})),
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
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const payload = {
    nonce,
    ts: Date.now(),
    prompt: state.promptResult?.positivePrompt || '',
    negativePrompt: state.promptResult?.negativePrompt || '',
    settings: {
      model: state.settings.selectedModel,
      aspectRatio: state.settings.defaultAspectRatio,
      cfgScale: 7,
      steps: 20,
    },
  };
  setJobState({ currentJobStatus: 'sent', currentJobNonce: nonce, generationStartTime: Date.now(), errorMessage: null });
  renderLoader(120);
  let seconds = 120;
  timerId = setInterval(() => {
    seconds -= 1;
    const node = document.querySelector('[data-countdown]');
    if (node) node.textContent = `${seconds}s`;
    if (seconds <= 0) clearInterval(timerId);
  }, 1000);
  timeoutId = setTimeout(() => {
    clearLoader();
    setJobState({ currentJobStatus: 'failed', errorMessage: 'Generation timed out after 120 seconds.' });
  }, 120000);
  window.dispatchEvent(new CustomEvent('xgen:generate', { detail: payload }));
}

// ─── xBatcher Batch Orchestration ──────────────────────────────────────────

function sendSingleGeneration(promptText) {
  const state = getState();
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const payload = {
    nonce,
    ts: Date.now(),
    prompt: promptText,
    negativePrompt: state.promptResult?.negativePrompt || '',
    settings: {
      model: state.settings.selectedModel,
      aspectRatio: state.settings.defaultAspectRatio,
      cfgScale: 7,
      steps: 20,
    },
  };
  setJobState({ currentJobStatus: 'sent', currentJobNonce: nonce, generationStartTime: Date.now(), errorMessage: null });
  renderLoader(120);
  let seconds = 120;
  timerId = setInterval(() => {
    seconds -= 1;
    const node = document.querySelector('[data-countdown]');
    if (node) node.textContent = `${seconds}s`;
    if (seconds <= 0) clearInterval(timerId);
  }, 1000);
  timeoutId = setTimeout(() => {
    clearLoader();
    if (batchMode && batchResolve) {
      const resolve = batchResolve;
      batchResolve = null;
      resolve({ success: false, error: 'Timeout' });
    }
  }, 120000);
  window.dispatchEvent(new CustomEvent('xgen:generate', { detail: payload }));
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
