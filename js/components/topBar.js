import { getState, updateTheme } from '../store.js';
import { openSettings } from './bridgeInstall.js';
import { icon } from '../icons.js';

export function renderTopBar() {
  const state = getState();
  const topBar = document.getElementById('top-bar');
  const titles = { home: 'Home', creationKit: 'Creation Kit', xgen: 'xGEN' };

  topBar.className = 'top-bar';
  topBar.innerHTML = `
    <button class="top-bar__brand icon-btn" data-go-home aria-label="Home">
      <span class="top-bar__brand-x">x</span><span class="top-bar__brand-gen">.GEN</span>
    </button>
    <div class="top-bar__title">${titles[state.app.currentPage] || 'x.GEN'}</div>
    <div class="top-bar__actions">
      <button class="icon-btn" data-toggle-theme aria-label="Toggle theme">${state.settings.theme === 'dark' ? icon('sun') : icon('moon')}</button>
      <button class="icon-btn" data-open-settings aria-label="Settings">${icon('settings')}</button>
    </div>
  `;

  topBar.querySelector('[data-go-home]').onclick = () => { window.location.hash = '#home'; };
  topBar.querySelector('[data-toggle-theme]').onclick = () => updateTheme(state.settings.theme === 'dark' ? 'light' : 'dark');
  topBar.querySelector('[data-open-settings]').onclick = () => openSettings();
}
