import { renderAccordion, bindAccordions } from './accordion.js';
import { renderSwatch } from './colorSwatch.js';
import { renderImageCard } from './imageCard.js';
import { getState, updateFieldSilent, updateMultiDummyFieldSilent, toggleLockField, persist, recomputePrompt, getConflictingOptions } from '../store.js';
import { showModal } from './modal.js';
import { getCreationKitCategories, normalizeCategoryId } from '../constants/categories.js';

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
      if (!promptValue) return;
      state.emphasis[promptValue] = button.dataset.emphasis;
      persist();
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

        const wordEl = document.querySelector('.word-bar__fill');
        const wordText = document.querySelector('.word-stats');
        if (wordEl && state.promptResult?.diagnostics) {
          const words = state.promptResult.diagnostics.wordCount || 0;
          const pct = Math.min(100, Math.round((words / 256) * 100));
          const color = words <= 160 ? 'var(--state-success)' : words <= 256 ? 'var(--state-warning)' : 'var(--state-error)';
          wordEl.style.width = pct + '%';
          wordEl.style.background = color;
          const activeCount = Object.values(state.dummies[state.activeDummyIndex].fields).filter((v) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
          const totalFields = state.schema.categories.reduce((sum, cat) => sum + cat.fields.length, 0);
          const strength = Math.round((activeCount / Math.max(totalFields, 1)) * 100);
          if (wordText) wordText.innerHTML = `<span><strong>${words}</strong> words</span><span>${activeCount}/${totalFields} fields · ${strength}%</span>`;
        }

        document.querySelectorAll('.prompt-text').forEach((el) => {
          if (el.classList.contains('prompt-text--negative')) {
            el.textContent = state.promptResult?.negativePrompt || '(empty)';
          } else {
            el.textContent = state.promptResult?.positivePrompt || '';
          }
        });
      };

      bindLongPress(button, () => {
        const option = (field.options || field.colors || []).find((item) => item.id === optionId);
        detailModal(field, option);
      });
    });
  });
}
