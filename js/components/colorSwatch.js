export function renderSwatch(option, selected) {
  return `
    <button class="swatch ${selected ? 'is-selected' : ''}" data-option-id="${option.id}" title="${option.label}">
      <span class="swatch__color" style="background:${option.value}"></span>
    </button>
  `;
}
