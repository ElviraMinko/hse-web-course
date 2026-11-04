import { el } from '../utils/dom.js';

export function confirmAction({ title, text, confirmLabel = 'Удалить' }) {
  return new Promise((resolve) => {
    const dialog = el('dialog', { className: 'modal', 'aria-label': title });
    const close = (result) => dialog.close(result);

    dialog.append(
      el('div', { className: 'modal-backdrop', onClick: () => close('cancel') }),
      el(
        'div',
        { className: 'modal-panel' },
        el('span', { className: 'modal-handle' }),
        el('h2', { className: 'modal-title' }, title),
        el('p', { className: 'modal-text' }, text),
        el(
          'div',
          { className: 'modal-actions' },
          el('button', { className: 'button button-secondary', type: 'button', onClick: () => close('cancel') }, 'Отмена'),
          el('button', { className: 'button button-danger', type: 'button', onClick: () => close('confirm') }, confirmLabel),
        ),
      ),
    );

    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'confirm');
      dialog.remove();
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}
