import { replaceAllData } from '../store.js';
import { el, hasFiles, icon } from '../utils/dom.js';
import { formatDateTime } from '../utils/date.js';
import { COMMENT_WORDS, MEMBER_WORDS, TASK_WORDS, countLabel } from '../utils/text.js';
import { BackupError, createBackupFile, createTasksCsvFile, downloadFile, readBackupFile } from '../features/backup.js';
import { queueToast, showToast } from './toast.js';

export function openTransferDialog({ file } = {}) {
  const error = el('p', { className: 'transfer-error', role: 'alert', hidden: true });
  const preview = el('div', { className: 'transfer-preview', hidden: true });
  const fileInput = el('input', { className: 'visually-hidden', type: 'file', accept: '.json,application/json' });
  const dropZone = el(
    'label',
    { className: 'file-drop' },
    fileInput,
    icon('upload'),
    'Перетащите файл .json сюда',
    el('span', { className: 'file-drop-hint' }, 'или нажмите, чтобы выбрать на компьютере'),
  );
  const dialog = el('dialog', { className: 'modal transfer-dialog', 'aria-labelledby': 'transfer-title' });

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    preview.hidden = true;
  }

  function download(createFile) {
    error.hidden = true;
    try {
      downloadFile(createFile());
      showToast('Файл сохранён в «Загрузки»');
    } catch {
      showError('Не удалось сохранить файл');
    }
  }

  function showPreview(name, { data, summary }) {
    const { tasks, members, comments, exportedAt } = summary;
    const replace = () => {
      if (!replaceAllData(data)) {
        showError('Не удалось сохранить данные: хранилище браузера переполнено или отключено');
        return;
      }
      queueToast(`Загружено: ${countLabel(tasks, TASK_WORDS)}`);
      window.location.reload();
    };

    preview.replaceChildren(
      el('p', {}, el('strong', {}, name), exportedAt ? ` — копия от ${formatDateTime(exportedAt)}` : ''),
      el('p', {}, `В файле ${countLabel(tasks, TASK_WORDS)}, ${countLabel(members, MEMBER_WORDS)} и ${countLabel(comments, COMMENT_WORDS)}. Текущие данные в этом браузере будут заменены.`),
      el(
        'div',
        { className: 'modal-actions' },
        el('button', { className: 'button button-secondary', type: 'button', onClick: () => { preview.hidden = true; } }, 'Отмена'),
        el('button', { className: 'button button-danger', type: 'button', onClick: replace }, 'Заменить данные'),
      ),
    );
    preview.hidden = false;
  }

  async function handleFile(selected) {
    error.hidden = true;
    preview.hidden = true;
    try {
      showPreview(selected.name, await readBackupFile(selected));
    } catch (problem) {
      showError(problem instanceof BackupError ? problem.message : 'Не удалось прочитать файл');
    } finally {
      fileInput.value = '';
    }
  }

  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  let dragDepth = 0;
  dialog.addEventListener('dragenter', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    dropZone.classList.add('file-drop-active');
  });
  dialog.addEventListener('dragover', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  dialog.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) dropZone.classList.remove('file-drop-active');
  });
  dialog.addEventListener('drop', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth = 0;
    dropZone.classList.remove('file-drop-active');
    const { files } = event.dataTransfer;
    if (files.length > 1) showError('Перетащите один файл');
    else handleFile(files[0]);
  });

  const close = () => dialog.close();
  const exportButton = (label, createFile) =>
    el('button', { className: 'button button-secondary', type: 'button', onClick: () => download(createFile) }, icon('download', 'md'), ` ${label}`);

  dialog.append(
    el('div', { className: 'modal-backdrop', onClick: close }),
    el(
      'div',
      { className: 'modal-panel' },
      el('span', { className: 'modal-handle' }),
      el(
        'header',
        { className: 'modal-header' },
        el('h2', { className: 'modal-title', id: 'transfer-title' }, 'Экспорт и импорт'),
        el('button', { className: 'icon-button', type: 'button', 'aria-label': 'Закрыть', onClick: close }, icon('close', 'md')),
      ),
      el('p', { className: 'modal-description' }, 'Данные хранятся только в этом браузере. Сохраните копию, чтобы перенести их на другое устройство или не потерять.'),
      el(
        'section',
        { className: 'transfer-section' },
        el('h3', { className: 'transfer-section-title' }, 'Скачать'),
        el(
          'div',
          { className: 'transfer-export' },
          exportButton('Резервная копия (JSON)', createBackupFile),
          exportButton('Задачи для Excel (CSV)', createTasksCsvFile),
        ),
      ),
      el(
        'section',
        { className: 'transfer-section' },
        el('h3', { className: 'transfer-section-title' }, 'Загрузить резервную копию'),
        dropZone,
        error,
        preview,
      ),
    ),
  );

  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  if (file) handleFile(file);
}
