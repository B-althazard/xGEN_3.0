import { getState, resetActiveDummy, updateField, updateFieldSilent, loadDummyFields } from '../store.js';
import { showModal } from '../components/modal.js';
import { escapeHtml } from '../utils/dom.js';

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomizeCurrentDummy() {
  const state = getState();
  const dummy = state.dummies[state.activeDummyIndex];
  state.schema.categories.forEach((category) => {
    if (category.id === 'futa' && state.characterType !== 'futa') return;
    category.fields.forEach((field) => {
      if (dummy.lockedFields.includes(field.id)) return;
      const items = field.options || field.colors || [];
      if (!items.length) return;
      if (field.type === 'multi-select' || field.multiSelect) {
        const count = Math.floor(Math.random() * Math.min(3, items.length + 1));
        const selected = [...items].sort(() => Math.random() - 0.5).slice(0, count).map((item) => item.id);
        updateField(field.id, selected);
      } else {
        const next = Math.random() < 0.2 ? null : randomChoice(items).id;
        updateField(field.id, next);
      }
    });
  });
}

export function randomizeCurrentDummySilent() {
  const state = getState();
  const dummy = state.dummies[state.activeDummyIndex];
  state.schema.categories.forEach((category) => {
    if (category.id === 'futa' && state.characterType !== 'futa') return;
    category.fields.forEach((field) => {
      if (dummy.lockedFields.includes(field.id)) return;
      const items = field.options || field.colors || [];
      if (!items.length) return;
      if (field.type === 'multi-select' || field.multiSelect) {
        const count = Math.floor(Math.random() * Math.min(3, items.length + 1));
        const selected = [...items].sort(() => Math.random() - 0.5).slice(0, count).map((item) => item.id);
        updateFieldSilent(field.id, selected);
      } else {
        const next = Math.random() < 0.2 ? null : randomChoice(items).id;
        updateFieldSilent(field.id, next);
      }
    });
  });
}

function openPresetBrowser() {
  const state = getState();
  const cards = [...state.defaultDummies, ...(state.savedPresets || [])].map((preset) => `
    <button class="select-card" data-browser-preset="${preset.id}">
      <div class="select-card__media">${escapeHtml(preset.name.slice(0, 2).toUpperCase())}</div>
      <div class="select-card__footer">${escapeHtml(preset.name)}</div>
    </button>
  `).join('');
  const { modal } = showModal(`
    <div class="section__label">Dummies / Dolls</div>
    <div class="overview-grid">${cards}</div>
    <div class="btn-row" style="margin-top:var(--sp-4);">
      <button class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `);
  modal.querySelectorAll('[data-browser-preset]').forEach((button) => {
    button.onclick = () => {
      const preset = [...state.defaultDummies, ...(state.savedPresets || [])].find((item) => item.id === button.dataset.browserPreset);
      if (!preset) return;
      loadDummyFields(preset);
      window.location.hash = '#creation-kit';
    };
  });
}

export function getFabActions() {
  return [
    { id: 'view-dummies', label: 'Dummies', action: () => { window.location.hash = '#home'; } },
    { id: 'view-dolls', label: 'Dolls', action: () => { window.location.hash = '#home'; } },
    { id: 'randomize', label: 'Randomize', action: () => randomizeCurrentDummy() },
    { id: 'presets', label: 'Load Preset', action: () => openPresetBrowser() },
    { id: 'reset', label: 'Reset All', action: () => resetActiveDummy() },
  ];
}
