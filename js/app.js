import { initializeStore, subscribe, getState, setPage, setCurrentCategory, setOnlineStatus, undo, redo } from './store.js';
import { renderTopBar } from './components/topBar.js';
import { renderFab } from './components/fab.js';
import { renderHome } from './pages/home.js';
import { renderCreationKit } from './pages/creationKit.js';
import { renderXgen } from './pages/xgen.js';
import { initializeBridgeManager } from './bridgeManager.js';
import { renderAgeGate } from './components/ageGate.js';
import { renderOnboarding } from './components/onboarding.js';
import { icon } from './icons.js';

const ROUTES = {
  '#home': 'home',
  '#creation-kit': 'creationKit',
  '#xgen': 'xgen',
};

function renderBottomNav() {
  const state = getState();
  const nav = document.getElementById('bottom-navbar');
  const items = [
    ['home', icon('home'), 'Home', '#home'],
    ['creationKit', icon('create'), 'Create', '#creation-kit'],
    ['xgen', icon('bolt'), 'xGEN', '#xgen'],
  ];

  nav.className = 'bottom-nav';
  nav.innerHTML = items.map(([id, svg, label, hash]) =>
    `<button class="bottom-nav__item ${state.app.currentPage === id ? 'is-active' : ''}" data-nav-hash="${hash}">
      ${svg}
      <span>${label}</span>
    </button>`
  ).join('');

  nav.querySelectorAll('[data-nav-hash]').forEach((button) => {
    button.onclick = () => { window.location.hash = button.dataset.navHash; };
  });
}

function currentRoute() {
  return ROUTES[window.location.hash] || 'home';
}

function render() {
  const state = getState();
  const container = document.getElementById('page-container');
  renderTopBar();
  renderBottomNav();
  renderFab();
  if (state.app.currentPage === 'home') renderHome(container);
  if (state.app.currentPage === 'creationKit') renderCreationKit(container);
  if (state.app.currentPage === 'xgen') renderXgen(container);
}

function handleRoute() {
  setPage(currentRoute());
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('online', () => setOnlineStatus(true));
window.addEventListener('offline', () => setOnlineStatus(false));
window.addEventListener('xgen:set-category', (event) => {
  setCurrentCategory(event.detail.categoryId);
});
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  }
  if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') || (event.ctrlKey && event.key.toLowerCase() === 'y')) {
    event.preventDefault();
    redo();
  }
  if (event.ctrlKey && event.key.toLowerCase() === 'g') {
    event.preventDefault();
    window.location.hash = '#xgen';
  }
});

initializeStore().then(() => {
  initializeBridgeManager();
  document.getElementById('app').hidden = false;
  handleRoute();
  const state = getState();
  if (!state.app.ageConfirmed) renderAgeGate();
  else if (!state.app.onboardingComplete) renderOnboarding();
  subscribe(() => render());
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});
