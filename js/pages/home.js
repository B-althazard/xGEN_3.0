import { getState } from '../store.js';
import { renderPresetCard, bindPresetSection } from '../modules/presets.js';

let activeTab = 'dummies';

export function renderHome(container) {
  const state = getState();

  const defaultCards = state.defaultDummies.map((preset) => renderPresetCard(preset, [
    `<button class="btn btn--sm" data-load-preset="${preset.id}">Use</button>`,
    `<button class="btn btn--sm btn--ghost" data-save-default-preset="${preset.id}">Save As</button>`,
  ])).join('');

  const savedCards = (state.savedPresets || []).length
    ? state.savedPresets.map((preset) => renderPresetCard(preset, [
        `<button class="btn btn--sm" data-load-preset="${preset.id}">Use</button>`,
        `<button class="btn btn--sm btn--ghost" data-open-preset-menu="${preset.id}">More</button>`,
      ])).join('')
    : `<div class="empty">
        <h3>No Dolls yet</h3>
        <p>Save a configured dummy from Creation Kit or xGEN.</p>
      </div>`;

  container.innerHTML = `
    <div class="page">
      <section class="hero">
        <div class="page-title">Build. Refine. Generate.</div>
        <p class="muted">Structured character prompts for AI image generation.</p>
        <button class="btn btn--primary" data-start-fresh-dummy>Start Creating</button>
      </section>

      <div class="section" style="margin-top:var(--sp-6);">
        <div class="tab-bar">
          <button class="pill ${activeTab === 'dummies' ? 'is-active' : ''}" data-tab="dummies">Dummies</button>
          <button class="pill ${activeTab === 'dolls' ? 'is-active' : ''}" data-tab="dolls">Dolls ${state.savedPresets?.length ? `(${state.savedPresets.length})` : ''}</button>
        </div>
      </div>

      ${activeTab === 'dummies' ? `
        <div class="section">
          <div class="page-subtitle" style="margin-bottom:var(--sp-4);">Default archetypes — tap to load, save to customize</div>
          <div class="grid-3">${defaultCards}</div>
        </div>
      ` : `
        <div class="section">
          <div class="page-subtitle" style="margin-bottom:var(--sp-4);">Your saved consistent characters</div>
          <div class="grid-3">${savedCards}</div>
        </div>
      `}
    </div>
  `;

  container.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.onclick = () => { activeTab = btn.dataset.tab; renderHome(container); };
  });

  bindPresetSection(container);
}
