import { renderAccordion, bindAccordions } from './accordion.js';
import { renderSwatch } from './colorSwatch.js';
import { renderImageCard } from './imageCard.js';
import { getState, updateField, updateMultiDummyField, toggleLockField, setEmphasis } from '../store.js';
import { showModal } from './modal.js';
import { getCreationKitCategories, normalizeCategoryId } from '../constants/categories.js';

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function detailModal(field, option) {
  const state = getState();
  const promptValue = option.promptValue || '';
  const currentLevel = state.emphasis[promptValue] || 'medium';
  const levels = ['low', 'medium', 'high'];
  const emphasisButtons = levels.map((level) =>
    `<button class="btn ${level === currentLevel ? 'btn--primary' : ''}" data-emphasis="${level}">${level.charAt(0).toUpperCase() + level.slice(1)}</button>`
  ).join('');
  const { modal } = showModal(`
    <div class="section__label">Option Detail</div>
    <h2>${option.label}</h2>
    <p>Prompt token: <code>${promptValue || '(empty)'}</code></p>
    <div class="toolbar" style="margin-top:var(--sp-4);">
      ${emphasisButtons}
    </div>
    <div class="btn-row" style="margin-top:var(--sp-4);">
      <button class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `);
  modal.querySelectorAll('[data-emphasis]').forEach((button) => {
    button.onclick = () => {
      if (promptValue) setEmphasis(promptValue, button.dataset.emphasis);
    };
  });
}

function renderField(field, value) {
  const selectedValues = ensureArray(value);
  const collection = field.options || field.colors || [];
  const isImageCard = field.type === 'shape-modal';
  const isSwatch = field.type === 'color-swatch';

  const optionsHtml = collection.map((option) => {
    const selected = selectedValues.includes(option.id);
    if (isSwatch) return renderSwatch(option, selected);
    if (isImageCard) return renderImageCard(option, selected);
    return `<button class="option-btn ${selected ? 'is-selected' : ''}" data-option-id="${option.id}">${option.label}</button>`;
  }).join('');

  return `<div class="${isSwatch ? 'swatch-grid' : 'option-grid'}" data-field-id="${field.id}" data-multi="${field.type === 'multi-select' || field.multiSelect ? 'true' : 'false'}">${optionsHtml}</div>`;
}

function bindLongPress(button, callback) {
  let timer = null;
  const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
  button.addEventListener('pointerdown', () => { clear(); timer = setTimeout(() => callback(), 450); });
  button.addEventListener('pointerup', clear);
  button.addEventListener('pointerleave', clear);
  button.addEventListener('pointercancel', clear);
  button.addEventListener('contextmenu', (event) => { event.preventDefault(); callback(); });
}

export function renderForm(container) {
  const state = getState();
  const dummy = state.dummies[state.activeDummyIndex];
  const schemaCategories = new Map(state.schema.categories.map((category) => [category.id, category]));
  const ckCategories = getCreationKitCategories(state);
  const activeCategoryId = normalizeCategoryId(state.app.currentCategory, state);
  const categoryGroup = ckCategories.find((item) => item.id === activeCategoryId) || ckCategories[0];

  const fields = categoryGroup.schemaIds.flatMap((schemaId) => {
    const category = schemaCategories.get(schemaId);
    if (!category) return [];
    if (schemaId === 'futa' && !(dummy.fields.futa_enabled === 'on' || state.characterType === 'futa')) {
      return category.fields.filter((field) => field.id === 'futa_enabled');
    }
    return category.fields;
  });

  container.innerHTML = `
    <div data-swipe-surface>
      ${fields.map((field) => renderAccordion({
        title: field.label,
        body: renderField(field, categoryGroup.id === 'multi-dummy' ? state.multiDummyInteraction[field.id] : dummy.fields[field.id]),
        locked: dummy.lockedFields.includes(field.id),
        open: false,
      })).join('')}
    </div>
  `;

  bindAccordions(container, {
    onToggleLock: (event) => {
      event.stopPropagation();
      const header = event.target.closest('.accordion');
      const heading = header.querySelector('[data-field-id]');
      if (heading) toggleLockField(heading.dataset.fieldId);
    },
  });

  fields.forEach((field) => {
    const fieldNode = container.querySelector(`[data-field-id="${field.id}"]`);
    if (!fieldNode) return;

    fieldNode.querySelectorAll('[data-option-id]').forEach((button) => {
      const optionId = button.dataset.optionId;
      button.onclick = () => {
        const current = dummy.fields[field.id];
        const currentValue = categoryGroup.id === 'multi-dummy' ? state.multiDummyInteraction[field.id] : current;

        if (field.type === 'multi-select' || field.multiSelect) {
          const values = ensureArray(currentValue);
          const next = values.includes(optionId) ? values.filter((value) => value !== optionId) : [...values, optionId];
          if (categoryGroup.id === 'multi-dummy') updateMultiDummyField(field.id, next);
          else updateField(field.id, next);
        } else {
          const next = currentValue === optionId ? null : optionId;
          if (categoryGroup.id === 'multi-dummy') updateMultiDummyField(field.id, next);
          else updateField(field.id, next);
        }
      };

      bindLongPress(button, () => {
        const option = (field.options || field.colors || []).find((item) => item.id === optionId);
        detailModal(field, option);
      });
    });
  });
}
