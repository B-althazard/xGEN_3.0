import { getState, setActiveImageIndex } from '../store.js';
import { icon } from '../icons.js';

export function renderGallery(container) {
  const state = getState();
  const images = state.xgen.generatedImages || [];

  if (!images.length) {
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
    <div class="gallery-container" style="padding:var(--sp-4);">
      <div class="gallery-header">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--sp-3);">Gallery</h2>
        <span style="font-size:12px;color:var(--text-tertiary);">${images.length} image${images.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="gallery-grid">
        ${images.map((img, index) => {
          const time = new Date(img.ts).toLocaleString();
          const prompt = (img.prompt || '').length > 80 ? img.prompt.substring(0, 80) + '...' : (img.prompt || '');
          return `
            <button class="gallery-card" data-gallery-index="${index}">
              <img src="${img.dataUrl}" alt="Generated image" loading="lazy">
              <div class="gallery-card__info">
                <div class="gallery-card__time">${time}</div>
                <div class="gallery-card__prompt">${prompt}</div>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-gallery-index]').forEach((card) => {
    card.onclick = () => {
      setActiveImageIndex(Number(card.dataset.galleryIndex));
      window.location.hash = '#xgen';
    };
  });
}
