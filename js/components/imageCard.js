export function renderImageCard(option, selected = false) {
  return `
    <button class="select-card ${selected ? 'is-selected' : ''}" data-option-id="${option.id}">
      <div class="select-card__media">◆</div>
      <div class="select-card__footer">${option.label}</div>
    </button>
  `;
}
