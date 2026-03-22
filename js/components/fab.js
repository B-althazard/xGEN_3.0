import { getState } from '../store.js';
import { getFabActions } from '../modules/terminal.js';
import { icon } from '../icons.js';

let expanded = false;

export function renderFab() {
  const container = document.getElementById('fab-container');
  const state = getState();
  const actions = getFabActions();

  container.innerHTML = `
    <div class="fab-shell">
      <div class="fab-actions" ${expanded ? '' : 'hidden'}>${actions.map((item) =>
        `<button class="fab-action" data-fab-action="${item.id}">${item.label}</button>`
      ).join('')}</div>
      <button class="fab-main" data-fab-toggle aria-label="Actions">${expanded ? icon('x') : icon('plus')}</button>
    </div>
  `;

  container.querySelector('[data-fab-toggle]').onclick = () => {
    expanded = !expanded;
    renderFab();
  };

  container.querySelectorAll('[data-fab-action]').forEach((button) => {
    button.onclick = () => {
      const action = actions.find((item) => item.id === button.dataset.fabAction);
      expanded = false;
      action?.action();
    };
  });
}
