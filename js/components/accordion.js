import { icon } from '../icons.js';

import { bindLongPress } from '../utils/dom.js';

export function renderAccordion({ title, body, locked, open = false }) {
  return `
    <div class="accordion ${open ? 'is-open' : ''}" data-accordion>
      <button class="accordion__trigger" data-accordion-trigger>
        <span>${title}</span>
        <span class="accordion__actions">
          <span class="lock-btn ${locked ? 'is-locked' : ''}" data-lock-field title="${locked ? 'Unlock' : 'Lock'}">
            ${locked ? icon('lock') : icon('unlock')}
          </span>
          <span class="accordion__trigger-icon">${icon('chevDown')}</span>
        </span>
      </button>
      <div class="accordion__body" ${open ? '' : 'hidden'}>${body}</div>
    </div>
  `;
}

export function bindAccordions(scope, callbacks = {}) {
  const openAccordions = callbacks.openAccordions || null;
  const isSingleOpen = callbacks.singleOpen === true;
  const enableHeaderLongPressLock = callbacks.enableHeaderLongPressLock === true;

  scope.querySelectorAll('[data-accordion]').forEach((node) => {
    const body = node.querySelector('.accordion__body');
    const trigger = node.querySelector('[data-accordion-trigger]');
    const fieldId = node.querySelector('[data-field-id]')?.dataset.fieldId;
    let longPressTriggered = false;

    trigger.onclick = (event) => {
      if (event.target.closest('[data-lock-field]')) return;
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }

      const willOpen = body.hidden;
      if (isSingleOpen && willOpen) {
        scope.querySelectorAll('[data-accordion]').forEach((otherNode) => {
          if (otherNode === node) return;
          otherNode.classList.remove('is-open');
          const otherBody = otherNode.querySelector('.accordion__body');
          if (otherBody) otherBody.hidden = true;
        });
        if (openAccordions) openAccordions.clear();
      }

      body.hidden = !body.hidden;
      node.classList.toggle('is-open');
      if (openAccordions && fieldId) {
        if (body.hidden) openAccordions.delete(fieldId);
        else openAccordions.add(fieldId);
      }
    };

    const lockButton = node.querySelector('[data-lock-field]');
    if (lockButton && callbacks.onToggleLock) {
      lockButton.onclick = callbacks.onToggleLock;
    }

    if (enableHeaderLongPressLock && fieldId && callbacks.onHeaderLongPress) {
      bindLongPress(trigger, () => {
        longPressTriggered = true;
        callbacks.onHeaderLongPress(fieldId);
      });
    }
  });
}
