export function renderDummyTabs(dummies, activeIndex) {
  return `
    <div class="dummy-tabs">
      ${dummies.map((dummy, index) =>
        `<button class="dummy-tab ${index === activeIndex ? 'is-active' : ''}" data-dummy-index="${index}" data-dummy-tab="${index}">${dummy.name}</button>`
      ).join('')}
      ${dummies.length < 3 ? `<button class="dummy-tab" data-add-dummy>+ Add</button>` : ''}
    </div>
  `;
}
