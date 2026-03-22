import { getState, loadDummyFields, saveCurrentPreset, savePresetPayload, deletePreset, replaceWithFreshDummy } from '../store.js';
import { showModal } from '../components/modal.js';

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function openSavedPresetMenu(preset) {
  const { modal } = showModal(`
    <div class="section__label">Saved Preset</div>
    <h2>${preset.name}</h2>
    <div class="btn-row btn-row--stack">
      <button class="btn" data-menu-use>Use</button>
      <button class="btn" data-menu-edit>Edit</button>
      <button class="btn" data-menu-delete>Delete</button>
      <button class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `);
  modal.querySelector('[data-menu-use]').onclick = () => {
    loadDummyFields(preset);
    window.location.hash = '#creation-kit';
  };
  modal.querySelector('[data-menu-edit]').onclick = () => {
    loadDummyFields(preset);
    window.location.hash = '#creation-kit';
  };
  modal.querySelector('[data-menu-delete]').onclick = async () => {
    await deletePreset(preset.id);
  };
}

export function renderPresetCard(preset) {
  const locked = preset.lockedFields?.length
    ? '<span style="position:absolute;top:8px;right:8px;font-size:9px;font-weight:700;color:var(--accent);background:var(--accent-muted);padding:2px 8px;border-radius:var(--r-pill);">Locked</span>'
    : '';
  return `
    <article class="preset-card" data-preset-id="${preset.id}">
      ${locked}
      <div class="preset-card__media">${initials(preset.name)}</div>
      <div class="preset-card__body">
        <div>
          <div class="preset-card__name">${preset.name}</div>
          <div class="preset-card__desc">${preset.description || preset.type || 'Preset'}</div>
        </div>
      </div>
    </article>
  `;
}

function openSaveAsModal(preset) {
  const { modal } = showModal(`
    <div class="section__label">Save As</div>
    <h2>${preset.name}</h2>
    <p>Save this preset as a Doll or Mannequin.</p>
    <div class="btn-row btn-row--stack">
      <button class="btn" data-save-preset-type="doll">Save as Doll</button>
      <button class="btn" data-save-preset-type="mannequin">Save as Mannequin</button>
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
    </div>
  `);
  modal.querySelectorAll('[data-save-preset-type]').forEach((button) => {
    button.onclick = async () => {
      const type = button.dataset.savePresetType;
      const name = prompt(`Name this ${type}:`, preset.name);
      if (!name) return;
      await savePresetPayload({
        type,
        name,
        characterType: 'female',
        fields: structuredClone(preset.fields || {}),
        lockedFields: type === 'mannequin' ? Object.keys(preset.fields || {}) : [],
        referencePhotoId: preset.referencePhotoId || null,
        emphasis: structuredClone(getState().emphasis),
      });
    };
  });
}

export function bindPresetSection(scope) {
  scope.querySelectorAll('.preset-card[data-preset-id]').forEach((card) => {
    card.onclick = () => {
      const state = getState();
      const id = card.dataset.presetId;
      const preset = [...state.defaultDummies, ...(state.savedPresets || [])].find((item) => item.id === id);
      if (!preset) return;
      loadDummyFields(preset);
      window.location.hash = '#creation-kit';
    };
  });
  scope.querySelectorAll('[data-load-preset]').forEach((button) => {
    button.onclick = () => {
      const state = getState();
      const id = button.dataset.loadPreset;
      const preset = [...state.defaultDummies, ...(state.savedPresets || [])].find((item) => item.id === id);
      if (!preset) return;
      loadDummyFields(preset);
      window.location.hash = '#creation-kit';
    };
  });
  scope.querySelectorAll('[data-save-default-preset]').forEach((button) => {
    button.onclick = () => {
      const state = getState();
      const preset = state.defaultDummies.find((item) => item.id === button.dataset.saveDefaultPreset);
      if (preset) openSaveAsModal(preset);
    };
  });
  scope.querySelectorAll('[data-delete-preset]').forEach((button) => {
    button.onclick = async () => {
      await deletePreset(button.dataset.deletePreset);
    };
  });
  scope.querySelectorAll('[data-open-preset-menu]').forEach((button) => {
    button.onclick = () => {
      const state = getState();
      const preset = (state.savedPresets || []).find((item) => item.id === button.dataset.openPresetMenu);
      if (preset) openSavedPresetMenu(preset);
    };
  });
  scope.querySelectorAll('[data-save-current]').forEach((button) => {
    button.onclick = async () => {
      const type = button.dataset.saveCurrent || 'doll';
      const name = prompt(`Name this ${type}:`, 'New Doll');
      if (!name) return;
      await saveCurrentPreset({ type, name });
    };
  });
  scope.querySelectorAll('[data-start-fresh-dummy]').forEach((button) => {
    button.onclick = () => {
      replaceWithFreshDummy();
      window.location.hash = '#creation-kit';
    };
  });
}
