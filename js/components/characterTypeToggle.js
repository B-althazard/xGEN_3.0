export function renderCharacterTypeToggle(currentType) {
  return `
    <div class="char-toggle">
      <button class="pill ${currentType === 'female' ? 'is-active' : ''}" data-character-type="female">Female</button>
      <button class="pill ${currentType === 'futa' ? 'is-active' : ''}" data-character-type="futa">Futa</button>
    </div>
  `;
}
