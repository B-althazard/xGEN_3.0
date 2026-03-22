import { markOnboardingComplete } from '../store.js';
import { icon } from '../icons.js';

export function renderOnboarding() {
  const root = document.getElementById('onboarding-overlay');
  const slides = [
    { title: 'Build Your Dummy', body: 'Use the Creation Kit to define identity, body, face, styling, scene, and pose with structured fields.', icon: 'create' },
    { title: 'Refine The Prompt', body: 'Watch the live prompt update in real time. Keep it in the green zone for the best results.', icon: 'edit' },
    { title: 'Generate In xGEN', body: 'Move to xGEN to review prompts, generate through the Venice bridge, and manage image history.', icon: 'bolt' },
  ];
  let index = 0;

  const paint = () => {
    const slide = slides[index];
    root.hidden = false;
    root.innerHTML = `
      <div class="modal-overlay" style="position:fixed;inset:0;display:grid;place-items:center;padding:16px;background:var(--overlay-blur);backdrop-filter:blur(8px);z-index:79;">
        <div class="modal" style="max-width:420px;text-align:center;">
          <div style="width:48px;height:48px;margin:0 auto var(--sp-4);color:var(--accent);">${icon(slide.icon)}</div>
          <div class="onboarding-dots">
            ${slides.map((_, i) => `<span class="onboarding-dot ${i === index ? 'is-active' : ''}"></span>`).join('')}
          </div>
          <h2>${slide.title}</h2>
          <p>${slide.body}</p>
          <div class="btn-row" style="justify-content:center;">
            ${index > 0 ? '<button class="btn" data-prev>Back</button>' : ''}
            <button class="btn btn--primary" data-next>${index === slides.length - 1 ? 'Get Started' : 'Next'}</button>
          </div>
        </div>
      </div>
    `;

    root.querySelector('[data-next]').onclick = () => {
      if (index === slides.length - 1) {
        markOnboardingComplete();
        root.hidden = true;
        return;
      }
      index += 1;
      paint();
    };
    const prev = root.querySelector('[data-prev]');
    if (prev) prev.onclick = () => { index -= 1; paint(); };
  };

  paint();
}
