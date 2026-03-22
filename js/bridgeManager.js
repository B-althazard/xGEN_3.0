import { getState, setBridgeDetected, setJobState, addGeneratedImage } from './store.js';
import { saveImage } from './storageManager.js';
import { showBridgeInstall } from './components/bridgeInstall.js';

let timeoutId = null;
let timerId = null;

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
    setJobState({ currentJobStatus: 'failed', errorMessage: event.detail?.message || 'Generation failed' });
  });
  window.addEventListener('xgen:image-received', async (event) => {
    clearLoader();
    const payload = event.detail;
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
    };
    await saveImage(image);
    await addGeneratedImage(image);
    setJobState({ currentJobStatus: 'done', currentJobNonce: payload.nonce, errorMessage: null });
    window.location.hash = '#xgen';
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
