import { getState, setCharacterType, setActiveDummy, addDummy, removeDummy, duplicateDummy, renameDummy, setCurrentCategory } from '../store.js';
import { renderCharacterTypeToggle } from '../components/characterTypeToggle.js';
import { renderWordCounter } from '../components/wordCounter.js';
import { renderDummyTabs } from '../components/dummyTabs.js';
import { renderForm } from '../components/formRenderer.js';
import { renderPrompter } from '../modules/prompter.js';
import { showModal } from '../components/modal.js';
import { getCreationKitCategories, normalizeCategoryId, getCategoryWindow } from '../constants/categories.js';
import { icon } from '../icons.js';

let isPromptExpanded = false;
let lastWarnBucket = 'safe';

function openDummyTabMenu(index) {
  const state = getState();
  const dummy = state.dummies[index];
  const { modal } = showModal(`
    <div class="section__label">Dummy Actions</div>
    <h2>${dummy.name}</h2>
    <div class="btn-row btn-row--stack">
      <button class="btn" data-rename-dummy>Rename</button>
      <button class="btn" data-duplicate-dummy ${state.dummies.length >= 3 ? 'disabled' : ''}>Duplicate</button>
      <button class="btn" data-remove-dummy ${state.dummies.length <= 1 ? 'disabled' : ''}>Remove</button>
      <button class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `);
  modal.querySelector('[data-rename-dummy]').onclick = () => {
    const name = prompt('Rename dummy:', dummy.name);
    if (name) renameDummy(index, name);
  };
  modal.querySelector('[data-duplicate-dummy]').onclick = () => duplicateDummy(index);
  modal.querySelector('[data-remove-dummy]').onclick = () => removeDummy(index);
}

function bindLongPress(button, callback) {
  let timer = null;
  const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
  button.addEventListener('pointerdown', () => { clear(); timer = setTimeout(callback, 450); });
  button.addEventListener('pointerup', clear);
  button.addEventListener('pointerleave', clear);
  button.addEventListener('pointercancel', clear);
  button.addEventListener('contextmenu', (event) => { event.preventDefault(); callback(); });
}

function bindSwipe(container, categories, currentIndex) {
  let startX = 0;
  const surface = container.querySelector('[data-swipe-surface]');
  if (!surface) return;
  surface.addEventListener('pointerdown', (event) => { startX = event.clientX; });
  surface.addEventListener('pointerup', (event) => {
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) < 50) return;
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const normalized = (nextIndex + categories.length) % categories.length;
    setCurrentCategory(categories[normalized].id);
  });
}

function maybeWarnPromptLength(wordCount) {
  const bucket = wordCount > 256 ? 'danger' : wordCount > 200 ? 'warn' : 'safe';
  if (bucket === 'danger' && lastWarnBucket !== 'danger') {
    showModal(`
      <div class="section__label">Prompt Warning</div>
      <h2>Prompt too long</h2>
      <p>Model performance may degrade with prompts this long.</p>
      <div class="btn-row"><button class="btn btn--primary" data-close-modal>OK</button></div>
    `);
  }
  lastWarnBucket = bucket;
}

export function renderCreationKit(container) {
  const state = getState();
  const totalFields = state.schema.categories.filter((c) => c.id !== 'quality' && c.id !== 'multi_dummy').reduce((sum, c) => sum + c.fields.length, 0);
  const activeFields = Object.values(state.dummies[state.activeDummyIndex].fields || {}).filter((value) => Array.isArray(value) ? value.length : value != null && value !== '').length;
  const { categories, index, current } = getCategoryWindow(state.app.currentCategory, state);
  maybeWarnPromptLength(state.promptResult?.diagnostics?.wordCount || 0);

  container.innerHTML = `
    <div class="page" data-swipe-surface>
      <!-- Category Tabs -->
      <div class="cat-bar">
        <div class="cat-bar__tabs">
          ${categories.map((cat) =>
            `<button class="cat-bar__item ${cat.id === current.id ? 'is-active' : ''}" data-category-nav="${cat.id}">
              ${icon(cat.icon, 14)}
              <span>${cat.label}</span>
            </button>`
          ).join('')}
        </div>
      </div>

      <!-- Character Type + Dummy Tabs -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);flex-wrap:wrap;padding:var(--sp-2) 0;">
        ${renderCharacterTypeToggle(state.characterType)}
        ${renderDummyTabs(state.dummies, state.activeDummyIndex)}
      </div>

      <!-- Word Counter -->
      ${renderWordCounter(state.promptResult, activeFields, totalFields)}

      <!-- Main Layout -->
      <div class="desktop-layout" style="margin-top:var(--sp-4);">
        <!-- Form -->
        <div>
          <div id="creation-kit-form"></div>
        </div>

        <!-- Sidebar -->
        <aside class="desktop-sidebar">
          <!-- Reference Card -->
          <div class="panel" style="margin-bottom:var(--sp-4);">
            <div class="section__label">Reference</div>
            <div style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-2);">
              <div style="width:48px;height:48px;border-radius:var(--r-lg);background:var(--bg-raised);display:grid;place-items:center;font-size:14px;font-weight:700;color:var(--text-tertiary);">${state.dummies[state.activeDummyIndex].name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style="font-weight:600;font-size:13px;">${state.dummies[state.activeDummyIndex].name}</div>
                <div class="muted" style="font-size:11px;">${activeFields} fields active</div>
              </div>
            </div>
          </div>

          <!-- Prompt Preview -->
          <div class="prompt-panel">
            <button class="accordion__trigger" data-toggle-prompter style="padding:0 0 var(--sp-3) 0;">
              <span class="prompt-panel__label">Prompt Preview</span>
              <span class="accordion__trigger-icon">${icon('chevDown')}</span>
            </button>
            ${isPromptExpanded ? `
              <div class="prompt-text" style="margin-bottom:var(--sp-3);">${state.promptResult?.positivePrompt || ''}</div>
              <div class="prompt-panel__label" style="margin-bottom:var(--sp-1);">Negative</div>
              <div class="prompt-text prompt-text--negative">${state.promptResult?.negativePrompt || '(empty)'}</div>
            ` : `
              <div class="prompt-text prompt-text--peek">${state.promptResult?.positivePrompt || ''}</div>
            `}
          </div>

          <!-- Recent Images -->
          ${state.xgen.generatedImages?.length ? `
            <div style="margin-top:var(--sp-4);">
              <div class="section__label" style="margin-bottom:var(--sp-2);">Recent</div>
              <div class="history-strip">
                ${state.xgen.generatedImages.slice(0, 8).map((item) =>
                  `<button class="history-thumb"><img src="${item.dataUrl}" alt="Generated thumbnail"></button>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </aside>
      </div>
    </div>
  `;

  renderForm(container.querySelector('#creation-kit-form'));

  // Bind category navigation
  container.querySelectorAll('[data-category-nav]').forEach((button) => {
    button.onclick = () => setCurrentCategory(button.dataset.categoryNav);
  });

  // Bind character type
  container.querySelectorAll('[data-character-type]').forEach((button) => {
    button.onclick = () => setCharacterType(button.dataset.characterType);
  });

  // Bind dummy tabs
  container.querySelectorAll('[data-dummy-index]').forEach((button) => {
    button.onclick = () => setActiveDummy(Number(button.dataset.dummyIndex));
  });
  container.querySelectorAll('[data-dummy-tab]').forEach((button) => {
    bindLongPress(button, () => openDummyTabMenu(Number(button.dataset.dummyTab)));
  });

  const add = container.querySelector('[data-add-dummy]');
  if (add) add.onclick = () => addDummy();

  // Bind prompter toggle
  const togglePrompter = container.querySelector('[data-toggle-prompter]');
  if (togglePrompter) togglePrompter.onclick = () => {
    isPromptExpanded = !isPromptExpanded;
    renderCreationKit(container);
  };

  // Bind swipe
  bindSwipe(container, categories, index);

  // Scroll active category into view
  const activeTab = container.querySelector('.cat-bar__item.is-active');
  if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
