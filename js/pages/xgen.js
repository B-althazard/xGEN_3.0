import { getState, saveCurrentPreset, setJobState, setActiveImageIndex, resetActiveDummy } from '../store.js';
import { triggerGeneration } from '../bridgeManager.js';
import { randomizeCurrentDummy } from '../modules/terminal.js';
import { icon } from '../icons.js';

let positiveOpen = true;
let negativeOpen = false;

export function renderXgen(container) {
  const state = getState();
  const image = state.xgen.generatedImages[state.xgen.activeImageIndex];
  const metrics = state.promptResult?.diagnostics || {};
  const canPrev = state.xgen.activeImageIndex < state.xgen.generatedImages.length - 1;
  const canNext = state.xgen.activeImageIndex > 0;

  container.innerHTML = `
    <div class="page">
      <div class="desktop-layout">
        <!-- Main: Image Viewer -->
        <div>
          <div class="viewer">
            ${image
              ? `<img class="viewer__image" src="${image.dataUrl}" alt="Generated result">`
              : `<div class="viewer__empty">
                  <div class="empty">
                    <div class="empty__icon">${icon('image')}</div>
                    <h3>No image yet</h3>
                    <p>Generate from the current prompt to see results here.</p>
                  </div>
                </div>`
            }
            <div class="viewer__toolbar">
              <button class="viewer__nav-btn" data-prev-image ${canPrev ? '' : 'disabled'}>${icon('chevLeft')}</button>
              <button class="viewer__nav-btn" data-next-image ${canNext ? '' : 'disabled'}>${icon('chevRight')}</button>
            </div>
          </div>

          <!-- Actions row -->
          <div class="toolbar" style="margin-bottom:var(--sp-4);">
            <button class="btn btn--sm" data-download-image ${image ? '' : 'disabled'}>${icon('download')} Save</button>
            <button class="btn btn--sm" data-fullscreen-image ${image ? '' : 'disabled'}>${icon('fullscreen')} Fullscreen</button>
            <button class="btn btn--sm" data-copy-prompt>${icon('copy')} Copy Prompt</button>
          </div>

          <!-- History strip -->
          ${state.xgen.generatedImages?.length ? `
            <div class="history-strip">
              ${state.xgen.generatedImages.map((item, index) =>
                `<button class="history-thumb ${index === state.xgen.activeImageIndex ? 'is-selected' : ''}" data-history-index="${index}">
                  <img src="${item.dataUrl}" alt="History thumbnail">
                </button>`
              ).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Sidebar -->
        <aside class="desktop-sidebar">
          <!-- Prompt display -->
          <div class="prompt-panel">
            <button class="accordion__trigger" data-toggle-positive style="padding:0 0 var(--sp-3) 0;">
              <span class="prompt-panel__label">Positive Prompt</span>
              <span class="accordion__trigger-icon">${icon('chevDown')}</span>
            </button>
            ${positiveOpen
              ? `<div class="prompt-text" style="margin-bottom:var(--sp-4);">${state.promptResult?.positivePrompt || ''}</div>`
              : `<div class="prompt-text prompt-text--peek" style="margin-bottom:var(--sp-3);">${state.promptResult?.positivePrompt || ''}</div>`
            }

            <button class="accordion__trigger" data-toggle-negative style="padding:var(--sp-3) 0 0 0;border-top:1px solid var(--border-subtle);">
              <span class="prompt-panel__label">Negative Prompt</span>
              <span class="accordion__trigger-icon">${icon('chevDown')}</span>
            </button>
            ${negativeOpen
              ? `<div class="prompt-text prompt-text--negative" style="margin-top:var(--sp-3);">${state.promptResult?.negativePrompt || '(empty)'}</div>`
              : ''
            }
          </div>

          <!-- Metrics -->
          <div class="metrics" style="margin-top:var(--sp-4);">
            <div class="metric">
              <div class="metric__value">${metrics.wordCount || 0}</div>
              <div class="metric__label">Words</div>
            </div>
            <div class="metric">
              <div class="metric__value">${metrics.tokenCountEstimate || 0}</div>
              <div class="metric__label">Tokens</div>
            </div>
            <div class="metric">
              <div class="metric__value">${state.promptResult?.keptTokens?.length || 0}</div>
              <div class="metric__label">Items</div>
            </div>
            <div class="metric">
              <div class="metric__value" style="font-size:14px;">${state.settings.selectedModel}</div>
              <div class="metric__label">Model</div>
            </div>
            <div class="metric">
              <div class="metric__value">${state.settings.defaultAspectRatio}</div>
              <div class="metric__label">Ratio</div>
            </div>
            <div class="metric">
              <div class="metric__value" style="font-size:14px;">${state.settings.selectedModel === 'chroma1-hd' ? 'Med' : '—'}</div>
              <div class="metric__label">Cost</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="action-grid" style="margin-top:var(--sp-4);">
            <button class="btn btn--generate" data-generate style="grid-column:1/-1;">${icon('bolt')} Generate</button>
            <button class="btn" data-back-edit>${icon('edit')} Edit</button>
            <button class="btn" data-save-doll>${icon('save')} Save Doll</button>
            <button class="btn" data-randomize>${icon('dice')} Random</button>
            <button class="btn" data-empty-form>${icon('trash')} Reset</button>
          </div>

          <!-- Bridge status -->
          <div class="status ${state.app.bridgeDetected ? 'status--success' : 'status--warning'}" style="margin-top:var(--sp-4);">
            ${state.app.bridgeDetected ? 'Bridge connected' : 'Bridge not detected'}
          </div>
          ${state.xgen.errorMessage
            ? `<div class="status status--error" style="margin-top:var(--sp-2);">${state.xgen.errorMessage}</div>`
            : ''
          }
        </aside>
      </div>
    </div>
  `;

  // Bind actions
  container.querySelector('[data-copy-prompt]').onclick = async () => navigator.clipboard.writeText(state.promptResult?.positivePrompt || '');
  container.querySelector('[data-generate]').onclick = () => triggerGeneration();
  container.querySelector('[data-back-edit]').onclick = () => { window.location.hash = '#creation-kit'; };
  container.querySelector('[data-save-doll]').onclick = async () => {
    const name = prompt('Name this Doll:', 'Saved Doll');
    if (!name) return;
    await saveCurrentPreset({ type: 'doll', name });
  };
  container.querySelector('[data-empty-form]').onclick = () => resetActiveDummy();
  container.querySelector('[data-randomize]').onclick = () => randomizeCurrentDummy();

  container.querySelector('[data-toggle-positive]').onclick = () => {
    positiveOpen = !positiveOpen;
    renderXgen(container);
  };
  container.querySelector('[data-toggle-negative]').onclick = () => {
    negativeOpen = !negativeOpen;
    renderXgen(container);
  };

  const prev = container.querySelector('[data-prev-image]');
  if (prev) prev.onclick = () => setActiveImageIndex(Math.min(state.xgen.generatedImages.length - 1, state.xgen.activeImageIndex + 1));
  const next = container.querySelector('[data-next-image]');
  if (next) next.onclick = () => setActiveImageIndex(Math.max(0, state.xgen.activeImageIndex - 1));

  container.querySelectorAll('[data-history-index]').forEach((button) => {
    button.onclick = () => setActiveImageIndex(Number(button.dataset.historyIndex));
  });

  const dl = container.querySelector('[data-download-image]');
  if (dl) dl.onclick = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.dataUrl;
    a.download = `xgen-${image.nonce}.png`;
    a.click();
  };

  const fs = container.querySelector('[data-fullscreen-image]');
  if (fs) fs.onclick = () => {
    const img = container.querySelector('.viewer__image');
    if (img?.requestFullscreen) img.requestFullscreen();
  };
}
