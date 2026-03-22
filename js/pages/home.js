import { getState } from '../store.js';
import { renderPresetCard, bindPresetSection } from '../modules/presets.js';
import { icon } from '../icons.js';

const HERO_KEY = 'xgen.heroDismissed';
let activeTab = 'dummies';

export function renderHome(container) {
  const state = getState();
  const heroDismissed = localStorage.getItem(HERO_KEY) === 'true';

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
      ${heroDismissed ? '' : `
        <section class="hero" style="position:relative;">
          <button class="icon-btn" data-dismiss-hero style="position:absolute;top:var(--sp-3);right:var(--sp-3);">${icon('x')}</button>
          <div class="page-title">Build. Refine. Generate.</div>
          <p class="muted">Structured character prompts for AI image generation.</p>
          <button class="btn btn--primary" data-start-fresh-dummy>Start Creating</button>
        </section>
      `}

      <div class="section" style="margin-top:${heroDismissed ? '0' : 'var(--sp-6)'};">
        <div class="grid-3">${activeTab === 'dummies' ? defaultCards : savedCards}</div>
      </div>
    </div>
  `;

  const dismissBtn = container.querySelector('[data-dismiss-hero]');
  if (dismissBtn) dismissBtn.onclick = () => {
    localStorage.setItem(HERO_KEY, 'true');
    renderHome(container);
  };

  bindPresetSection(container);
}
