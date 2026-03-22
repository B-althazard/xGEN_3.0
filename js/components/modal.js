export function showModal(content, { onClose } = {}) {
  const overlay = document.getElementById('modal-overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<div class="modal">${content}</div>`;
  const close = () => {
    overlay.hidden = true;
    overlay.innerHTML = '';
    if (onClose) onClose();
  };
  overlay.onclick = (event) => {
    if (event.target === overlay || event.target.closest('[data-close-modal]')) close();
  };
  return { close, modal: overlay.firstElementChild };
}
