import { STATUSES, getStatus, isKnown } from '../data/dictionaries.js';
import {
  getCurrentUser, getPreference, getSprint, getTask, getTasks,
  resetData, setPreference, setTaskStatus,
} from '../store.js';
import { checkRadio, el, hasFiles, qs, qsa, replaceContent } from '../utils/dom.js';
import { formatDateRange } from '../utils/date.js';
import { confirmAction } from '../components/confirmDialog.js';
import { renderLayout } from '../components/layout.js';
import { createTaskCard } from '../components/taskCard.js';
import { showToast } from '../components/toast.js';
import { openTransferDialog } from '../components/transferDialog.js';
import { setupBoardDragAndDrop } from '../features/dragAndDrop.js';
import { setupReminderToggle } from '../features/deadlineReminders.js';
import { readUrlParams, writeUrlParams } from '../features/urlState.js';

const FILTERS = {
  all: () => true,
  mine: (task, user) => task.assigneeId === user.id,
  high: (task) => task.priority === 'high',
};

const SEARCH_URL_DELAY_MS = 300;

function matchesQuery(task, query) {
  if (!query) return true;
  return task.title.toLowerCase().includes(query) || task.tags.some((tag) => tag.toLowerCase().includes(query));
}

export function init() {
  const searchForm = qs('#board-search');
  const searchInput = qs('#board-search-input');
  const searchToggle = qs('#board-search-toggle');
  const toolbar = qs('#board-toolbar');
  const filterField = qs('#board-filter');
  const tabInputs = qsa('input[name="board-tab"]');

  let query = '';
  let searchUrlTimer = null;

  const dragAndDrop = setupBoardDragAndDrop(qs('.board-columns'), {
    onMove: (taskId, status) => applyStatus(taskId, status),
    onAvailabilityChange: () => render(),
  });

  function render() {
    const user = getCurrentUser();
    const filterId = getPreference('boardFilter');
    const filter = FILTERS[filterId] ?? FILTERS.all;
    const isFiltered = Boolean(query) || filterId !== 'all';
    const visible = getTasks().filter((task) => filter(task, user) && matchesQuery(task, query));
    const cardOptions = { onStatusChange: handleStatusSelect, draggable: dragAndDrop.isActive() };

    for (const status of STATUSES) {
      const column = qs(`[data-column="${status.id}"]`);
      const tasks = visible.filter((task) => task.status === status.id);

      qs('[data-column-count]', column).textContent = tasks.length;
      qs(`[data-tab-count="${status.id}"]`).textContent = tasks.length;

      const items = tasks.length
        ? tasks.map((task) => el('li', {}, createTaskCard(task, cardOptions)))
        : el('li', { className: 'board-column-empty' }, isFiltered ? 'Нет задач по этому фильтру' : 'Здесь пока пусто');
      replaceContent(qs('[data-column-list]', column), items);
    }

    renderProgress();
  }

  function renderProgress() {
    const tasks = getTasks();
    const done = tasks.filter((task) => task.status === 'done').length;
    const sprint = getSprint();
    const progress = qs('#board-progress');

    qs('#board-dates').textContent = formatDateRange(sprint.start, sprint.end);
    qs('#board-done').textContent = `выполнено ${done} из ${tasks.length}`;
    qs('#board-progress-text').textContent = `${done} из ${tasks.length}`;
    progress.max = Math.max(tasks.length, 1);
    progress.value = done;
    progress.textContent = `${done} из ${tasks.length}`;
  }

  function applyStatus(taskId, status) {
    if (!setTaskStatus(taskId, status)) return false;
    render();
    showToast(`«${getTask(taskId).title}» → ${getStatus(status).label}`);
    return true;
  }

  function handleStatusSelect(taskId, status) {
    if (!applyStatus(taskId, status)) return;
    document.querySelector(`[data-task-id="${taskId}"] .status-select`)?.focus();
  }

  function setSearchOpen(isOpen) {
    toolbar.classList.toggle('board-toolbar-search-open', isOpen);
    searchToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function applyUrlState({ fromHistory = false } = {}) {
    const params = readUrlParams(['filter', 'q', 'tab']);
    if (FILTERS[params.filter]) setPreference('boardFilter', params.filter);
    else if (fromHistory || !FILTERS[getPreference('boardFilter')]) setPreference('boardFilter', 'all');
    if (isKnown(STATUSES, params.tab)) setPreference('boardTab', params.tab);

    searchInput.value = params.q ?? '';
    query = searchInput.value.trim().toLowerCase();
    setSearchOpen(Boolean(query));

    checkRadio(filterField, 'filter', getPreference('boardFilter'));
    checkRadio(document, 'board-tab', getPreference('boardTab'));
  }

  function syncFilterToUrl({ push }) {
    const filter = getPreference('boardFilter');
    writeUrlParams({ filter: filter === 'all' ? null : filter }, { push });
  }

  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim().toLowerCase();
    render();
    clearTimeout(searchUrlTimer);
    searchUrlTimer = setTimeout(() => writeUrlParams({ q: searchInput.value.trim() }), SEARCH_URL_DELAY_MS);
  });
  searchForm.addEventListener('submit', (event) => event.preventDefault());

  searchToggle.addEventListener('click', () => {
    const isOpen = !toolbar.classList.contains('board-toolbar-search-open');
    setSearchOpen(isOpen);
    if (isOpen) {
      searchInput.focus();
    } else if (query) {
      searchInput.value = '';
      query = '';
      writeUrlParams({ q: null });
      render();
    }
  });

  filterField.addEventListener('change', (event) => {
    setPreference('boardFilter', event.target.value);
    syncFilterToUrl({ push: true });
    render();
  });

  for (const input of tabInputs) {
    input.addEventListener('change', () => {
      setPreference('boardTab', input.value);
      writeUrlParams({ tab: input.value });
    });
  }

  window.addEventListener('popstate', () => {
    applyUrlState({ fromHistory: true });
    render();
  });

  qs('#board-reset').addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Сбросить данные?',
      text: 'Все созданные задачи, комментарии и изменения в команде пропадут — вернутся демонстрационные данные.',
      confirmLabel: 'Сбросить',
    });
    if (!confirmed) return;
    const saved = resetData();
    writeUrlParams({ filter: null, q: null, tab: null });
    applyUrlState();
    renderLayout();
    render();
    if (saved) showToast('Данные сброшены');
  });

  qs('#board-transfer').addEventListener('click', () => openTransferDialog());

  window.addEventListener('dragover', (event) => {
    if (hasFiles(event) && !document.querySelector('dialog[open]')) event.preventDefault();
  });
  window.addEventListener('drop', (event) => {
    if (!hasFiles(event) || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    openTransferDialog({ file: event.dataTransfer.files[0] });
  });

  setupReminderToggle(qs('#board-reminders'));

  applyUrlState();
  syncFilterToUrl({ push: false });
  render();
}
