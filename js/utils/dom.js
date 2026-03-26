export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function truncateText(value, max = 80) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export function bindLongPress(button, callback, delayMs = 450) {
  let timer = null;
  let longPressTriggered = false;
  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  button.addEventListener('pointerdown', () => {
    clear();
    longPressTriggered = false;
    timer = setTimeout(() => {
      longPressTriggered = true;
      callback();
    }, delayMs);
  });
  button.addEventListener('pointerup', clear);
  button.addEventListener('pointerleave', clear);
  button.addEventListener('pointercancel', clear);
  button.addEventListener('click', (event) => {
    if (!longPressTriggered) return;
    event.preventDefault();
    event.stopPropagation();
    longPressTriggered = false;
  }, true);
  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    longPressTriggered = true;
    callback();
  });
}
