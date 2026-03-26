import { getState, setCharacterType, setActiveDummy, addDummy, removeDummy, duplicateDummy, renameDummy, setCurrentCategory, setActiveImageIndex } from '../store.js';
import { renderCharacterTypeToggle } from '../components/characterTypeToggle.js';
import { renderWordCounter } from '../components/wordCounter.js';
import { renderDummyTabs } from '../components/dummyTabs.js';
import { renderForm } from '../components/formRenderer.js';
import { showModal } from '../components/modal.js';
import { getCreationKitCategories, normalizeCategoryId, getCategoryWindow } from '../constants/categories.js';
import { icon } from '../icons.js';
import { bindLongPress, escapeHtml } from '../utils/dom.js';

let isPromptExpanded = false;
let lastWarnBucket = 'safe';

function openDummyTabMenu(index) {
  const state = getState();
  const dummy = state.dummies[index];
  const { modal } = showModal(`
    <div class="section__label">Dummy Actions</div>
    <h2>${escapeHtml(dummy.name)}</h2>
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

function bindGlobalSwipe() {
  if (bindGlobalSwipe._bound) return;
  bindGlobalSwipe._bound = true;
  const app = document.getElementById('app');
  let startX = 0;
  let startY = 0;
  let tracking = false;

  app.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  }, { capture: true });

  app.addEventListener('pointermove', () => {}, { capture: true });

  app.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    e.preventDefault();
    const state = getState();
    const categories = getCreationKitCategories(state);
    const currentIdx = categories.findIndex((c) => c.id === normalizeCategoryId(state.app.currentCategory, state));
    if (currentIdx < 0) return;
    const dir = deltaX < 0 ? 1 : -1;
    const nextIdx = (currentIdx + dir + categories.length) % categories.length;

    const form = app.querySelector('#creation-kit-form');
    if (form) {
      const outClass = dir > 0 ? 'slide-out-left' : 'slide-out-right';
      form.classList.add(outClass);
      form.addEventListener('animationend', () => {
        form.classList.remove(outClass);
        setCurrentCategory(categories[nextIdx].id);
        const newForm = app.querySelector('#creation-kit-form');
        if (newForm) {
          const inClass = dir > 0 ? 'slide-in-left' : 'slide-in-right';
          newForm.classList.add(inClass);
          newForm.addEventListener('animationend', () => { newForm.classList.remove(inClass); }, { once: true });
        }
      }, { once: true });
    } else {
      setCurrentCategory(categories[nextIdx].id);
    }
  }, { capture: true });
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
  const activeDummy = state.dummies[state.activeDummyIndex];
  const escapedDummyName = escapeHtml(activeDummy.name);
  const positivePrompt = escapeHtml(state.promptResult?.positivePrompt || '');
  const negativePrompt = escapeHtml(state.promptResult?.negativePrompt || '(empty)');
  maybeWarnPromptLength(state.promptResult?.diagnostics?.wordCount || 0);

  container.innerHTML = `
    <div class="page">
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
              <div style="width:48px;height:48px;border-radius:var(--r-lg);background:var(--bg-raised);display:grid;place-items:center;font-size:14px;font-weight:700;color:var(--text-tertiary);">${escapeHtml(activeDummy.name.slice(0, 2).toUpperCase())}</div>
              <div>
                <div style="font-weight:600;font-size:13px;">${escapedDummyName}</div>
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
              <div class="prompt-text" style="margin-bottom:var(--sp-3);">${positivePrompt}</div>
              <div class="prompt-panel__label" style="margin-bottom:var(--sp-1);">Negative</div>
              <div class="prompt-text prompt-text--negative">${negativePrompt}</div>
            ` : `
              <div class="prompt-text prompt-text--peek">${positivePrompt}</div>
            `}
          </div>

          <!-- Recent Images -->
          ${state.xgen.generatedImages?.length ? `
            <div style="margin-top:var(--sp-4);">
              <div class="section__label" style="margin-bottom:var(--sp-2);">Recent</div>
              <div class="history-strip">
                ${state.xgen.generatedImages.slice(0, 8).map((item, index) =>
                  `<button class="history-thumb" data-recent-index="${index}"><img src="${item.dataUrl}" alt="Generated thumbnail"></button>`
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

  // Bind Recent strip clicks
  container.querySelectorAll('[data-recent-index]').forEach((btn) => {
    btn.onclick = () => {
      setActiveImageIndex(Number(btn.dataset.recentIndex));
      window.location.hash = '#xgen';
    };
  });

  // Bind prompter toggle
  const togglePrompter = container.querySelector('[data-toggle-prompter]');
  if (togglePrompter) togglePrompter.onclick = () => {
    isPromptExpanded = !isPromptExpanded;
    renderCreationKit(container);
  };

  // Bind swipe
  bindGlobalSwipe();

  // Scroll active category into view
  const activeTab = container.querySelector('.cat-bar__item.is-active');
  if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
