import { STATUSES, getPriority } from '../data/dictionaries.js';
import { getMember } from '../store.js';
import { el, icon, replaceContent } from '../utils/dom.js';
import { formatShortDate, todayISO } from '../utils/date.js';
import { createAvatar } from './avatar.js';

export const isOverdue = (task) => task.status !== 'done' && Boolean(task.due) && task.due < todayISO();

function createDue(task) {
  if (!task.due) return el('span', { className: 'task-card-due' }, icon('calendar', 'sm'), 'Без срока');
  const overdue = isOverdue(task);
  return el(
    'time',
    { className: overdue ? 'task-card-due task-card-due-overdue' : 'task-card-due', datetime: task.due, title: overdue ? 'Дедлайн прошёл' : null },
    icon('calendar', 'sm'),
    formatShortDate(task.due),
  );
}

function createTitle(task, interactive, draggable) {
  const title = task.title.trim();
  if (!interactive) {
    return el('h3', { className: title ? 'task-card-title' : 'task-card-title task-preview-title-empty' }, title || 'Название задачи');
  }
  const link = el('a', { className: 'task-card-link', href: `task.html?id=${task.id}`, draggable: draggable ? 'false' : null }, title);
  return el('h3', { className: 'task-card-title' }, link);
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

export function renderTaskCard(article, task, { interactive = true, draggable = false, onStatusChange } = {}) {
  const priority = getPriority(task.priority);
  article.dataset.taskId = task.id;
  article.draggable = draggable;

  return replaceContent(
    article,
    el(
      'ul',
      { className: 'task-card-labels' },
      el('li', { className: `priority-badge priority-badge-${priority.id}` }, priority.label),
      task.tags.map((tag) => el('li', { className: 'task-tag' }, tag)),
    ),
    createTitle(task, interactive, draggable),
    el(
      'footer',
      { className: 'task-card-footer' },
      createDue(task),
      createAvatar(getMember(task.assigneeId), { className: 'task-card-assignee', withTitle: true }),
      interactive && createStatusSelect(task, onStatusChange),
    ),
  );
}

export const createTaskCard = (task, options) => renderTaskCard(el('article', { className: 'task-card' }), task, options);
