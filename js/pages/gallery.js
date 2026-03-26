import { getState, setActiveImageNonce, removeGeneratedImage, removeGeneratedImages } from '../store.js';
import { icon } from '../icons.js';
import { escapeHtml, truncateText } from '../utils/dom.js';
import { groupImages } from './galleryGrouping.js';

let selectionMode = false;
const selectedNonces = new Set();

function resetSelection() {
  selectionMode = false;
  selectedNonces.clear();
}

function renderGalleryCard(image, selected = false) {
  const time = new Date(image.ts).toLocaleString();
  const prompt = escapeHtml(truncateText(image.prompt || '', 80));

  return `
    <div class="gallery-card-wrap ${selected ? 'is-selected' : ''}" style="position:relative;">
      ${selectionMode ? `<button class="btn btn--sm" data-gallery-toggle="${image.nonce}" style="position:absolute;top:8px;left:8px;z-index:1;background:rgba(0,0,0,0.7);color:#fff;">${selected ? 'Selected' : 'Select'}</button>` : ''}
      <button class="btn btn--sm btn--icon" data-gallery-delete="${image.nonce}" style="position:absolute;top:8px;right:8px;z-index:1;background:rgba(0,0,0,0.7);color:#fff;">${icon('trash')}</button>
      <button class="gallery-card ${selected ? 'is-selected' : ''}" data-gallery-nonce="${image.nonce}">
        <img src="${image.dataUrl}" alt="Generated image" loading="lazy">
        <div class="gallery-card__info">
          <div class="gallery-card__time">${escapeHtml(time)}</div>
          <div class="gallery-card__prompt">${prompt}</div>
        </div>
      </button>
    </div>
  `;
}

export function renderGallery(container) {
  const state = getState();
  const images = state.xgen.generatedImages || [];
  const groups = groupImages(images);

  if (!images.length) {
    resetSelection();
    container.innerHTML = `
      <div class="center" style="flex-direction:column;gap:var(--sp-4);padding:var(--sp-8);">
        ${icon('gallery')}
        <p style="color:var(--text-tertiary);text-align:center;">No images yet.<br>Generate your first image on the xGEN page.</p>
        <button class="btn btn--generate" onclick="window.location.hash='#xgen'">Go to xGEN</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="gallery-container" style="padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-4);">
      <div class="gallery-header" style="display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);flex-wrap:wrap;">
        <div>
          <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--sp-1);">Gallery</h2>
          <span style="font-size:12px;color:var(--text-tertiary);">${images.length} image${images.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex;gap:var(--sp-2);align-items:center;flex-wrap:wrap;">
          ${selectionMode ? `<span style="font-size:12px;color:var(--text-tertiary);">${selectedNonces.size} selected</span>` : ''}
          <button class="btn btn--sm" data-gallery-selection-toggle>${selectionMode ? 'Done' : 'Select'}</button>
          ${selectionMode ? `<button class="btn btn--danger btn--sm" data-gallery-delete-selected ${selectedNonces.size ? '' : 'disabled'}>${icon('trash')} Delete Selected</button>` : ''}
        </div>
      </div>
      ${groups.map((subjectGroup) => `
        <section class="panel" style="padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-4);">
          <div>
            <div class="section__label">${escapeHtml(subjectGroup.subject)}</div>
          </div>
          ${subjectGroup.orders.map((orderGroup) => `
            <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
              <div style="font-size:12px;font-weight:600;color:var(--text-secondary);">${escapeHtml(orderGroup.order)}</div>
              <div class="gallery-grid">
                ${orderGroup.images.map((image) => renderGalleryCard(image, selectedNonces.has(image.nonce))).join('')}
              </div>
            </div>
          `).join('')}
        </section>
      `).join('')}
    </div>
  `;

  container.querySelector('[data-gallery-selection-toggle]').onclick = () => {
    if (selectionMode) selectedNonces.clear();
    selectionMode = !selectionMode;
    renderGallery(container);
  };

  container.querySelectorAll('[data-gallery-nonce]').forEach((card) => {
    card.onclick = () => {
      const nonce = card.dataset.galleryNonce;
      if (selectionMode) {
        if (selectedNonces.has(nonce)) selectedNonces.delete(nonce);
        else selectedNonces.add(nonce);
        renderGallery(container);
        return;
      }
      setActiveImageNonce(nonce);
      window.location.hash = '#xgen';
    };
  });

  container.querySelectorAll('[data-gallery-toggle]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const nonce = button.dataset.galleryToggle;
      if (selectedNonces.has(nonce)) selectedNonces.delete(nonce);
      else selectedNonces.add(nonce);
      renderGallery(container);
    };
  });

  container.querySelectorAll('[data-gallery-delete]').forEach((button) => {
    button.onclick = async (event) => {
      event.stopPropagation();
      const nonce = button.dataset.galleryDelete;
      if (!window.confirm('Delete this image from the gallery?')) return;
      selectedNonces.delete(nonce);
      await removeGeneratedImage(nonce);
      renderGallery(container);
    };
  });

  const deleteSelected = container.querySelector('[data-gallery-delete-selected]');
  if (deleteSelected) {
    deleteSelected.onclick = async () => {
      if (!selectedNonces.size) return;
      if (!window.confirm(`Delete ${selectedNonces.size} selected image${selectedNonces.size === 1 ? '' : 's'}?`)) return;
      await removeGeneratedImages([...selectedNonces]);
      resetSelection();
      renderGallery(container);
    };
  }
}
