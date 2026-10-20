

import { STATUSES, getStatus } from '../data/dictionaries.js';
import {
  getCurrentUser, getPreference, getSprint, getTask, getTasks,
  resetData, setPreference, setTaskStatus,
} from '../store.js';
import { checkRadio, el, qs, qsa, replaceContent } from '../utils/dom.js';
import { formatDateRange } from '../utils/date.js';
import { confirmAction } from '../components/confirmDialog.js';
import { renderLayout } from '../components/layout.js';
import { createTaskCard } from '../components/taskCard.js';
import { showToast } from '../components/toast.js';

const FILTERS = {
  all: () => true,
  mine: (task, user) => task.assigneeId === user.id,
  high: (task) => task.priority === 'high',
};

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

  function render() {
    const user = getCurrentUser();
    const filterId = getPreference('boardFilter');
    const filter = FILTERS[filterId] ?? FILTERS.all;
    const isFiltered = Boolean(query) || filterId !== 'all';
    const visible = getTasks().filter((task) => filter(task, user) && matchesQuery(task, query));

    for (const status of STATUSES) {
      const column = qs(`[data-column="${status.id}"]`);
      const tasks = visible.filter((task) => task.status === status.id);

      qs('[data-column-count]', column).textContent = tasks.length;
      qs(`[data-tab-count="${status.id}"]`).textContent = tasks.length;

      const items = tasks.length
        ? tasks.map((task) => el('li', {}, createTaskCard(task, { onStatusChange: handleStatusChange })))
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

  function handleStatusChange(taskId, status) {
    if (!setTaskStatus(taskId, status)) return;
    render();

    document.querySelector(`[data-task-id="${taskId}"] .status-select`)?.focus();
    showToast(`«${getTask(taskId).title}» → ${getStatus(status).label}`);
  }

  function restorePreferences() {
    checkRadio(filterField, 'filter', getPreference('boardFilter'));
    checkRadio(document, 'board-tab', getPreference('boardTab'));
  }

  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim().toLowerCase();
    render();
  });
  searchForm.addEventListener('submit', (event) => event.preventDefault());

  searchToggle.addEventListener('click', () => {
    const isOpen = toolbar.classList.toggle('board-toolbar-search-open');
    searchToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      searchInput.focus();
    } else if (query) {
      searchInput.value = '';
      query = '';
      render();
    }
  });

  filterField.addEventListener('change', (event) => {
    setPreference('boardFilter', event.target.value);
    render();
  });

  for (const input of tabInputs) {
    input.addEventListener('change', () => setPreference('boardTab', input.value));
  }

  qs('#board-reset').addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Сбросить данные?',
      text: 'Все созданные задачи, комментарии и изменения в команде пропадут — вернутся демонстрационные данные.',
      confirmLabel: 'Сбросить',
    });
    if (!confirmed) return;
    resetData();
    query = '';
    searchInput.value = '';
    restorePreferences();
    renderLayout();
    render();
    showToast('Данные сброшены');
  });

  restorePreferences();
  render();
}
