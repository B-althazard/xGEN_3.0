import { markAgeConfirmed } from '../store.js';

export function renderAgeGate() {
  const root = document.getElementById('age-gate');
  root.hidden = false;
  root.innerHTML = `
    <div class="modal-overlay" style="position:fixed;inset:0;display:grid;place-items:center;padding:16px;background:var(--overlay-blur);backdrop-filter:blur(12px);z-index:80;">
      <div class="modal" style="max-width:400px;text-align:center;">
        <div style="font-size:40px;margin-bottom:var(--sp-4);">18+</div>
        <h2>Adult Content</h2>
        <p>By continuing you confirm you are 18 years of age or older.</p>
        <div class="btn-row" style="justify-content:center;">
          <button class="btn btn--primary" data-age-enter>I am 18 or older</button>
          <button class="btn" data-age-exit>Exit</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('[data-age-enter]').onclick = () => {
    markAgeConfirmed();
    root.hidden = true;
  };
  root.querySelector('[data-age-exit]').onclick = () => {
    window.location.href = 'about:blank';
  };
}
