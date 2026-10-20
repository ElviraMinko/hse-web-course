import { STATUSES, getPriority } from '../data/dictionaries.js';
import { getMember } from '../store.js';
import { el, icon, replaceContent } from '../utils/dom.js';
import { formatShortDate, todayISO } from '../utils/date.js';
import { createAvatar } from './avatar.js';

export function isOverdue(task) {
  return task.status !== 'done' && Boolean(task.due) && task.due < todayISO();
}

function createLabels(task) {
  const priority = getPriority(task.priority);
  return el(
    'ul',
    { className: 'task-card-labels' },
    el('li', { className: `priority-badge priority-badge-${priority.id}` }, priority.label),
    task.tags.map((tag) => el('li', { className: 'task-tag' }, tag)),
  );
}

function createDue(task) {
  if (!task.due) {
    return el('span', { className: 'task-card-due' }, icon('calendar', 'sm'), 'Без срока');
  }
  const overdue = isOverdue(task);
  return el(
    'time',
    {
      className: overdue ? 'task-card-due task-card-due-overdue' : 'task-card-due',
      datetime: task.due,
      title: overdue ? 'Дедлайн прошёл' : null,
    },
    icon('calendar', 'sm'),
    formatShortDate(task.due),
  );
}

function createStatusSelect(task, onStatusChange) {
  return el(
    'select',
    {
      className: 'status-select',
      'aria-label': `Статус задачи «${task.title}»`,
      value: task.status,
      onChange: (event) => onStatusChange(task.id, event.target.value),
    },
    STATUSES.map((status) => el('option', { value: status.id }, status.label)),
  );
}

export function renderTaskCard(article, task, { interactive = true, onStatusChange } = {}) {
  const assignee = task.assigneeId ? getMember(task.assigneeId) : null;
  const title = task.title.trim();

  const heading = interactive
    ? el('h3', { className: 'task-card-title' }, el('a', { className: 'task-card-link', href: `task.html?id=${task.id}` }, title))
    : el('h3', { className: title ? 'task-card-title' : 'task-card-title task-preview-title-empty' }, title || 'Название задачи');

  article.dataset.taskId = task.id;
  return replaceContent(
    article,
    createLabels(task),
    heading,
    el(
      'footer',
      { className: 'task-card-footer' },
      createDue(task),
      createAvatar(assignee, { className: 'task-card-assignee', withTitle: true }),
      interactive && createStatusSelect(task, onStatusChange),
    ),
  );
}

export function createTaskCard(task, options) {
  return renderTaskCard(el('article', { className: 'task-card' }), task, options);
}
