import { renderAccordion, bindAccordions } from './accordion.js';
import { renderSwatch } from './colorSwatch.js';
import { renderImageCard } from './imageCard.js';
import { getState, updateFieldSilent, updateMultiDummyFieldSilent, toggleLockField, setEmphasis, getConflictingOptions } from '../store.js';
import { showModal } from './modal.js';
import { getCreationKitCategories, normalizeCategoryId } from '../constants/categories.js';
import { bindLongPress, escapeHtml } from '../utils/dom.js';
import { getOptionDetail } from '../utils/optionDetails.js';

const openAccordions = new Set();

function showConflictToast(clears) {
  const existing = document.querySelector('.conflict-toast');
  if (existing) existing.remove();

  const messages = clears.map((c) => c.reason).join(' | ');
  const toast = document.createElement('div');
  toast.className = 'conflict-toast';
  toast.textContent = messages;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('conflict-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('conflict-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function detailModal(field, option) {
  if (!field || !option || field.colors) return;
  const state = getState();
  const promptValue = option.promptValue || '';
  const currentLevel = state.emphasis[promptValue] || 'medium';
  const levels = ['low', 'medium', 'high'];
  const detail = getOptionDetail(field, option);
  const emphasisButtons = levels.map((level) =>
    `<button class="btn ${level === currentLevel ? 'btn--primary' : ''}" data-emphasis="${level}">${level.charAt(0).toUpperCase() + level.slice(1)}</button>`
  ).join('');
  const { modal } = showModal(`
    <div class="section__label">Option Detail</div>
    <h2>${escapeHtml(option.label)}</h2>
    ${detail?.summary ? `<p>${escapeHtml(detail.summary)}</p>` : ''}
    <p>Prompt token: <code>${escapeHtml(promptValue || '(empty)')}</code></p>
    ${detail?.details?.length ? `
      <div class="panel panel--flat" style="margin-top:var(--sp-4);padding:0;">
        ${detail.details.map((line) => `<p style="margin-bottom:var(--sp-2);color:var(--text-secondary);">${escapeHtml(line)}</p>`).join('')}
      </div>
    ` : ''}
    <div class="toolbar" style="margin-top:var(--sp-4);">
      ${emphasisButtons}
    </div>
    <div class="btn-row" style="margin-top:var(--sp-4);">
      <button class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `);
  modal.querySelectorAll('[data-emphasis]').forEach((button) => {
    button.onclick = () => {
      if (!promptValue) return;
      setEmphasis(promptValue, button.dataset.emphasis);
      modal.querySelectorAll('[data-emphasis]').forEach((btn) => {
        btn.classList.toggle('btn--primary', btn === button);
      });
    };
  });
}

function renderField(field, value, disabledOptions) {
  const selectedValues = ensureArray(value);
  const collection = field.options || field.colors || [];
  const isImageCard = field.type === 'shape-modal';
  const isSwatch = field.type === 'color-swatch';
  const disabledSet = new Set(disabledOptions || []);

  const optionsHtml = collection.map((option) => {
    const selected = selectedValues.includes(option.id);
    const disabled = disabledSet.has(option.id);
    if (isSwatch) return renderSwatch(option, selected, disabled);
    if (isImageCard) return renderImageCard(option, selected, disabled);
    return `<button class="option-btn ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}" data-option-id="${option.id}" ${disabled ? 'disabled' : ''}>${option.label}</button>`;
  }).join('');

  return `<div class="${isSwatch ? 'swatch-grid' : 'option-grid'}" data-field-id="${field.id}" data-multi="${field.type === 'multi-select' || field.multiSelect ? 'true' : 'false'}">${optionsHtml}</div>`;
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
    if (schemaId === 'futa' && state.characterType !== 'futa') {
      return [];
    }
    return category.fields;
  });

  const conflicts = getConflictingOptions(dummy.fields);

  container.innerHTML = `
    <div>
      ${fields.map((field) => renderAccordion({
        title: field.label,
        body: renderField(field, categoryGroup.id === 'multi-dummy' ? state.multiDummyInteraction[field.id] : dummy.fields[field.id], conflicts[field.id]),
        locked: dummy.lockedFields.includes(field.id),
        open: openAccordions.has(field.id),
      })).join('')}
    </div>
  `;

  bindAccordions(container, {
    openAccordions,
    singleOpen: true,
    enableHeaderLongPressLock: window.matchMedia('(max-width: 768px), (pointer: coarse)').matches,
    onToggleLock: (event) => {
      event.stopPropagation();
      const header = event.target.closest('.accordion');
      const heading = header.querySelector('[data-field-id]');
      if (heading) toggleLockField(heading.dataset.fieldId);
    },
    onHeaderLongPress: (fieldId) => {
      toggleLockField(fieldId);
    },
  });

  fields.forEach((field) => {
    const fieldNode = container.querySelector(`[data-field-id="${field.id}"]`);
    if (!fieldNode) return;

    fieldNode.querySelectorAll('[data-option-id]').forEach((button) => {
      const optionId = button.dataset.optionId;
      if (button.classList.contains('is-disabled')) return;

      button.onclick = () => {
        const current = dummy.fields[field.id];
        const currentValue = categoryGroup.id === 'multi-dummy' ? state.multiDummyInteraction[field.id] : current;

        let clears = [];
        if (field.type === 'multi-select' || field.multiSelect) {
          const values = ensureArray(currentValue);
          const next = values.includes(optionId) ? values.filter((value) => value !== optionId) : [...values, optionId];
          if (categoryGroup.id === 'multi-dummy') updateMultiDummyFieldSilent(field.id, next);
          else clears = updateFieldSilent(field.id, next);
        } else {
          const next = currentValue === optionId ? null : optionId;
          if (categoryGroup.id === 'multi-dummy') updateMultiDummyFieldSilent(field.id, next);
          else clears = updateFieldSilent(field.id, next);
        }

        if (clears.length) {
          showConflictToast(clears);
        }

        renderForm(container);
      };

      if (!field.colors) {
        bindLongPress(button, () => {
          const option = (field.options || field.colors || []).find((item) => item.id === optionId);
          detailModal(field, option);
        });
      }
    });
  });
}
