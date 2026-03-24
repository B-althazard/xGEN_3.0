import { getState, saveCurrentPreset, setJobState, setActiveImageIndex, resetActiveDummySilent, setSettingSilent, persist, recomputePrompt, addPromptToList, removePromptFromList, clearPromptList, updateBatchSetting, clearBatchHistory, setBatchRunning } from '../store.js';
import { triggerGeneration, startBatchJob, stopBatchJob } from '../bridgeManager.js';
import { randomizeCurrentDummySilent } from '../modules/terminal.js';
import { icon } from '../icons.js';

let positiveOpen = true;
let negativeOpen = false;
let xbOpen = true;

function showPill(message) {
  const pill = document.createElement('div');
  pill.className = 'pill-toast';
  pill.textContent = message;
  document.body.appendChild(pill);
  setTimeout(() => pill.remove(), 1600);
}

function buildXBatcherHtml(state) {
  const batch = state.batch;
  const isRunning = batch.running;
  const promptCount = batch.promptList.length;
  const historyCount = batch.history.length;

  const promptListHtml = promptCount > 0
    ? batch.promptList.map((p, i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border-subtle);font-size:12px;">
        <span style="color:var(--text-tertiary);min-width:18px;">${i + 1}.</span>
        <span style="flex:1;color:var(--text-secondary);word-break:break-all;">${p.text.length > 80 ? p.text.substring(0, 80) + '...' : p.text}</span>
        <button class="btn btn--sm btn--icon" data-remove-prompt="${p.id}" title="Remove">${icon('x')}</button>
      </div>`).join('')
    : '<div style="color:var(--text-tertiary);font-size:12px;font-style:italic;padding:4px 0;">No prompts in list</div>';

  const historyHtml = historyCount > 0
    ? batch.history.slice(0, 30).map((h) => {
      const time = new Date(h.timestamp).toLocaleTimeString();
      const statusColor = h.status === 'success' ? 'var(--accent)' : '#f38ba8';
      const statusIcon = h.status === 'success' ? '&#10003;' : '&#10007;';
      const promptShort = h.prompt.length > 50 ? h.prompt.substring(0, 50) + '...' : h.prompt;
      return `<div style="display:flex;gap:6px;padding:3px 0;border-bottom:1px solid var(--border-subtle);font-size:11px;">
        <span style="color:${statusColor};font-weight:700;">${statusIcon}</span>
        <span style="color:var(--text-tertiary);min-width:55px;">${time}</span>
        <span style="flex:1;color:var(--text-secondary);word-break:break-all;">${promptShort}</span>
      </div>`;
    }).join('')
    : '<div style="color:var(--text-tertiary);font-size:11px;font-style:italic;">No history</div>';

  return `
    <div style="margin-top:var(--sp-4);border-top:1px solid var(--border-subtle);padding-top:var(--sp-4);">
      <button class="accordion__trigger" data-toggle-xb style="padding:0 0 var(--sp-3) 0;">
        <span class="prompt-panel__label" style="color:var(--accent);">xBatcher</span>
        <span class="accordion__trigger-icon">${icon('chevDown')}</span>
      </button>
      ${xbOpen ? `
        <div style="margin-top:var(--sp-2);">
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:var(--sp-2);">Add Prompt</div>
          <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);">
            <textarea data-batch-prompt-input rows="2" placeholder="Enter a prompt to batch..." style="flex:1;box-sizing:border-box;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:6px 10px;font-size:12px;font-family:inherit;resize:vertical;"></textarea>
          </div>
          <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-3);">
            <button class="btn btn--sm" data-add-batch-prompt>${icon('plus')} Add to List</button>
            ${promptCount > 0 ? `<button class="btn btn--sm" data-clear-batch-prompts>${icon('trash')} Clear</button>` : ''}
          </div>

          <div style="max-height:120px;overflow-y:auto;margin-bottom:var(--sp-3);">
            ${promptListHtml}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);margin-bottom:var(--sp-3);">
            <div>
              <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Repeat</div>
              <input type="number" data-batch-repeat min="1" value="${batch.repeatCount}" style="width:100%;box-sizing:border-box;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:4px 8px;font-size:12px;">
            </div>
            <div>
              <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Mode</div>
              <select data-batch-mode style="width:100%;box-sizing:border-box;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:4px 8px;font-size:12px;">
                <option value="iteration" ${batch.mode === 'iteration' ? 'selected' : ''}>Iter</option>
                <option value="unique" ${batch.mode === 'unique' ? 'selected' : ''}>New Chat</option>
              </select>
            </div>
            <div>
              <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Delay</div>
              <input type="number" data-batch-delay min="1" value="${batch.delay}" style="width:100%;box-sizing:border-box;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:4px 8px;font-size:12px;">
            </div>
          </div>

          <div style="display:flex;gap:var(--sp-2);">
            ${isRunning
              ? `<button class="btn btn--danger" data-stop-batch style="flex:1;">${icon('x')} Stop Batch</button>`
              : `<button class="btn btn--generate" data-start-batch style="flex:1;" ${promptCount === 0 ? 'disabled' : ''}>${icon('bolt')} Start Batch</button>`
            }
          </div>

          <div style="margin-top:var(--sp-4);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
              <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);">History (${historyCount})</div>
              ${historyCount > 0 ? `<button class="btn btn--sm btn--icon" data-clear-batch-history title="Clear history">${icon('trash')}</button>` : ''}
            </div>
            <div style="max-height:150px;overflow-y:auto;">
              ${historyHtml}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderXgen(container) {
  const state = getState();
  const image = state.xgen.generatedImages[state.xgen.activeImageIndex];
  const metrics = state.promptResult?.diagnostics || {};
  const canPrev = state.xgen.activeImageIndex < state.xgen.generatedImages.length - 1;
  const canNext = state.xgen.activeImageIndex > 0;

  const promptSettingsHtml = `
    <div style="margin-top:var(--sp-4);display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:var(--sp-1);">Prompt Order</div>
        <div class="dummy-tabs">
          <button class="dummy-tab ${state.settings.promptOrder === 'subject-first' ? 'is-active' : ''}" data-prompt-order="subject-first">Subject First</button>
          <button class="dummy-tab ${state.settings.promptOrder === 'style-first' ? 'is-active' : ''}" data-prompt-order="style-first">Style First</button>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:var(--sp-1);">Aesthetic</div>
        <div style="display:flex;align-items:center;gap:var(--sp-1);">
          <button class="btn btn--sm btn--icon" data-aesthetic-dec>−</button>
          <span style="font-size:14px;font-weight:700;color:var(--text-accent);min-width:20px;text-align:center;" data-aesthetic-value>${state.settings.aesthetic}</span>
          <button class="btn btn--sm btn--icon" data-aesthetic-inc>+</button>
        </div>
      </div>
    </div>
  `;

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

        <!-- Sidebar (desktop only, uses same content as mobile block below) -->
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

          <!-- Prompt Settings -->
          ${promptSettingsHtml}

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

          <!-- xBatcher -->
          ${buildXBatcherHtml(state)}
        </aside>

        <!-- Mobile: sidebar content visible below viewer on small screens -->
        <div class="xgen-mobile-block">
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

          ${promptSettingsHtml}

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

          <div class="action-grid" style="margin-top:var(--sp-4);">
            <button class="btn btn--generate" data-generate style="grid-column:1/-1;">${icon('bolt')} Generate</button>
            <button class="btn" data-back-edit>${icon('edit')} Edit</button>
            <button class="btn" data-save-doll>${icon('save')} Save Doll</button>
            <button class="btn" data-randomize>${icon('dice')} Random</button>
            <button class="btn" data-empty-form>${icon('trash')} Reset</button>
          </div>

          <div class="status ${state.app.bridgeDetected ? 'status--success' : 'status--warning'}" style="margin-top:var(--sp-4);">
            ${state.app.bridgeDetected ? 'Bridge connected' : 'Bridge not detected'}
          </div>
          ${state.xgen.errorMessage
            ? `<div class="status status--error" style="margin-top:var(--sp-2);">${state.xgen.errorMessage}</div>`
            : ''
          }

          <!-- xBatcher (mobile) -->
          ${buildXBatcherHtml(state)}
        </div>
      </div>
    </div>
  `;

  // Bind actions
  container.querySelectorAll('[data-copy-prompt]').forEach((btn) => {
    btn.onclick = async () => {
      await navigator.clipboard.writeText(getState().promptResult?.positivePrompt || '');
      showPill('Prompt copied');
    };
  });
  container.querySelectorAll('[data-generate]').forEach((btn) => {
    btn.onclick = () => triggerGeneration();
  });
  container.querySelectorAll('[data-back-edit]').forEach((btn) => {
    btn.onclick = () => { window.location.hash = '#creation-kit'; };
  });
  container.querySelectorAll('[data-save-doll]').forEach((btn) => {
    btn.onclick = async () => {
      const name = prompt('Name this Doll:', 'Saved Doll');
      if (!name) return;
      await saveCurrentPreset({ type: 'doll', name });
      showPill('Doll saved');
    };
  });
  container.querySelectorAll('[data-empty-form]').forEach((btn) => {
    btn.onclick = () => {
      resetActiveDummySilent();
      renderXgen(container);
      showPill('Reset');
    };
  });
  container.querySelectorAll('[data-randomize]').forEach((btn) => {
    btn.onclick = () => {
      randomizeCurrentDummySilent();
      renderXgen(container);
      const prompt = getState().promptResult?.positivePrompt || '';
      if (prompt) {
        navigator.clipboard.writeText(prompt);
        showPill('Randomized & copied');
      } else {
        showPill('Randomized');
      }
    };
  });

  container.querySelectorAll('[data-toggle-positive]').forEach((btn) => {
    btn.onclick = () => {
      positiveOpen = !positiveOpen;
      renderXgen(container);
    };
  });
  container.querySelectorAll('[data-toggle-negative]').forEach((btn) => {
    btn.onclick = () => {
      negativeOpen = !negativeOpen;
      renderXgen(container);
    };
  });

  const updatePromptText = () => {
    const s = getState();
    container.querySelectorAll('.prompt-text').forEach((el) => {
      if (el.classList.contains('prompt-text--negative')) {
        el.textContent = s.promptResult?.negativePrompt || '(empty)';
      } else {
        el.textContent = s.promptResult?.positivePrompt || '';
      }
    });
  };

  container.querySelectorAll('[data-prompt-order]').forEach((button) => {
    button.onclick = () => {
      setSettingSilent('promptOrder', button.dataset.promptOrder);
      container.querySelectorAll('[data-prompt-order]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.promptOrder === button.dataset.promptOrder);
      });
      updatePromptText();
    };
  });

  container.querySelectorAll('[data-aesthetic-dec]').forEach((btn) => {
    btn.onclick = () => {
      const s = getState();
      const val = Math.max(6, s.settings.aesthetic - 1);
      setSettingSilent('aesthetic', val);
      container.querySelectorAll('[data-aesthetic-value]').forEach((span) => { span.textContent = val; });
      updatePromptText();
    };
  });
  container.querySelectorAll('[data-aesthetic-inc]').forEach((btn) => {
    btn.onclick = () => {
      const s = getState();
      const val = Math.min(10, s.settings.aesthetic + 1);
      setSettingSilent('aesthetic', val);
      container.querySelectorAll('[data-aesthetic-value]').forEach((span) => { span.textContent = val; });
      updatePromptText();
    };
  });

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

  // ── xBatcher bindings ──────────────────────────────────────────────────

  container.querySelectorAll('[data-toggle-xb]').forEach((btn) => {
    btn.onclick = () => {
      xbOpen = !xbOpen;
      renderXgen(container);
    };
  });

  container.querySelectorAll('[data-add-batch-prompt]').forEach((btn) => {
    btn.onclick = () => {
      const input = container.querySelector('[data-batch-prompt-input]');
      const text = input?.value?.trim();
      if (!text) return;
      addPromptToList(text);
      input.value = '';
      renderXgen(container);
      showPill('Prompt added');
    };
  });

  container.querySelectorAll('[data-clear-batch-prompts]').forEach((btn) => {
    btn.onclick = () => {
      clearPromptList();
      renderXgen(container);
    };
  });

  container.querySelectorAll('[data-remove-prompt]').forEach((btn) => {
    btn.onclick = () => {
      removePromptFromList(btn.dataset.removePrompt);
      renderXgen(container);
    };
  });

  container.querySelectorAll('[data-batch-repeat]').forEach((input) => {
    input.onchange = () => {
      const val = Math.max(1, parseInt(input.value, 10) || 1);
      updateBatchSetting('repeatCount', val);
    };
  });

  container.querySelectorAll('[data-batch-mode]').forEach((select) => {
    select.onchange = () => {
      updateBatchSetting('mode', select.value);
    };
  });

  container.querySelectorAll('[data-batch-delay]').forEach((input) => {
    input.onchange = () => {
      const val = Math.max(1, parseInt(input.value, 10) || 1);
      updateBatchSetting('delay', val);
    };
  });

  container.querySelectorAll('[data-start-batch]').forEach((btn) => {
    btn.onclick = () => {
      startBatchJob();
    };
  });

  container.querySelectorAll('[data-stop-batch]').forEach((btn) => {
    btn.onclick = () => {
      stopBatchJob();
      renderXgen(container);
      showPill('Batch stopped');
    };
  });

  container.querySelectorAll('[data-clear-batch-history]').forEach((btn) => {
    btn.onclick = () => {
      clearBatchHistory();
      renderXgen(container);
    };
  });
}
