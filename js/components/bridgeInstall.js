import { getState, updateSetting, resetLocalData } from '../store.js';
import { showModal } from './modal.js';

export function showBridgeInstall() {
  showModal(`
    <div class="section__label">Bridge</div>
    <h2>Bridge Not Detected</h2>
    <p>The Venice Bridge UserScript is required to generate images.</p>
    <ol>
      <li>Install Violentmonkey</li>
      <li>Install the bridge userscript</li>
      <li>Keep Venice.ai open in a tab</li>
      <li>Press Generate again</li>
    </ol>
    <div class="btn-row">
      <a class="btn btn--primary" href="https://violentmonkey.github.io/get-it/" target="_blank" rel="noreferrer">Install Violentmonkey</a>
      <a class="btn" href="./userscript/xgen-venice-bridge.user.js" target="_blank" rel="noreferrer">Install Bridge Script</a>
      <button class="btn btn--ghost" data-close-modal>Not now</button>
    </div>
  `);
}

export function openSettings() {
  const state = getState();
  const { modal } = showModal(`
    <div class="settings-sheet">
      <div class="section__label">Settings</div>

      <div class="settings-group">
        <div class="settings-group__title">Appearance</div>
        <div class="settings-field">
          <label>Theme</label>
          <select data-setting="theme"><option value="dark">Dark</option><option value="light">Light</option></select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Generation</div>
        <div class="settings-field">
          <label>Model</label>
          <select data-setting="selectedModel"><option value="chroma1-hd">Chroma1-HD</option></select>
        </div>
        <div class="settings-field">
          <label>Aspect Ratio</label>
          <select data-setting="defaultAspectRatio"><option>2:3</option><option>1:1</option><option>3:2</option></select>
        </div>
        <div class="settings-field">
          <label>Realism Mode</label>
          <select data-setting="realismMode"><option value="auto">Auto</option><option value="studio">Studio</option><option value="social">Social</option><option value="editorial">Editorial</option></select>
        </div>
        <div class="settings-field">
          <label>Negative Prompt</label>
          <div class="muted" style="font-size:12px;">Disabled for the current model profile.</div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Bridge</div>
        <div class="status ${state.app.bridgeDetected ? 'status--success' : 'status--warning'}" style="margin-bottom:var(--sp-3);">
          ${state.app.bridgeDetected ? 'Connected' : 'Not detected'}
        </div>
        <button class="btn" data-open-bridge>Bridge Install Guide</button>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Advanced</div>
        <button class="btn" data-reset-all>Reset All Local Data</button>
      </div>

      <button class="btn btn--ghost" data-close-modal style="margin-top:var(--sp-4);">Close</button>
    </div>
  `);

  modal.querySelectorAll('[data-setting]').forEach((select) => {
    select.value = state.settings[select.dataset.setting];
    select.onchange = () => updateSetting(select.dataset.setting, select.value);
  });
  modal.querySelector('[data-open-bridge]').onclick = showBridgeInstall;
  modal.querySelector('[data-reset-all]').onclick = async () => {
    await resetLocalData();
    window.location.reload();
  };
}
