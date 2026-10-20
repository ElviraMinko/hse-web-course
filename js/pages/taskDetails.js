

import { STATUSES, getPriority, getStatus } from '../data/dictionaries.js';
import { addComment, getComments, getCurrentUser, getMember, getTask, getTasks, setTaskStatus } from '../store.js';
import { el, getQueryParam, qs, replaceContent } from '../utils/dom.js';
import { formatDateTime, formatLongDate } from '../utils/date.js';
import { getShortName } from '../utils/text.js';
import { createAvatar } from '../components/avatar.js';
import { isOverdue } from '../components/taskCard.js';
import { showToast } from '../components/toast.js';

const FORMER_MEMBER = 'Бывший участник';

function findTask() {
  const id = getQueryParam('id');
  if (id) return getTask(id);

  const first = getTasks()[0] ?? null;
  if (first) window.history.replaceState(null, '', `?id=${first.id}`);
  return first;
}

function renderNotFound() {
  document.title = 'Задача не найдена — Спринт';
  replaceContent(
    qs('#task-main'),
    el(
      'section',
      { className: 'empty-state' },
      el('h1', { className: 'empty-state-title' }, 'Задача не найдена'),
      el('p', { className: 'empty-state-text' }, 'Возможно, её удалили или в ссылке опечатка.'),
      el('a', { className: 'button button-primary', href: 'index.html' }, 'Вернуться к доске'),
    ),
  );
}

function createPriorityBadge(task, { withSuffix = false } = {}) {
  const priority = getPriority(task.priority);
  return el(
    'span',
    { className: `priority-badge priority-badge-${priority.id} priority-badge-large` },
    priority.label,
    withSuffix && el('span', { className: 'task-header-priority-suffix' }, 'приоритет'),
  );
}

const createTag = (tag) => el('span', { className: 'task-tag task-tag-large' }, tag);

function createDate(iso) {
  return el('time', { datetime: iso }, formatLongDate(iso));
}

function renderHeader(task) {
  document.title = `${task.title} — Спринт`;
  qs('#task-topbar-code').textContent = task.code;
  qs('#task-breadcrumb-code').textContent = task.code;
  qs('#task-title').textContent = task.title;

  replaceContent(
    qs('#task-labels'),
    createPriorityBadge(task, { withSuffix: true }),
    task.tags.map(createTag),
    el('span', { className: 'task-header-created' }, 'Создана ', createDate(task.createdAt)),
  );

  const statusSelect = qs('#task-status');
  statusSelect.value = task.status;
  for (const status of STATUSES) {
    statusSelect.classList.toggle(`task-status-${status.id}`, status.id === task.status);
  }

  const editUrl = `task-new.html?id=${task.id}`;
  qs('#task-edit').href = editUrl;
  qs('#task-edit-mobile').href = editUrl;
}

function renderDescription(task) {
  const description = qs('#task-description');
  description.textContent = task.description || 'Описание пока не добавлено — его можно дописать в режиме редактирования.';
  description.classList.toggle('task-description-empty', !task.description);
}

function renderMeta(task) {
  const status = getStatus(task.status);
  const assignee = task.assigneeId ? getMember(task.assigneeId) : null;
  const author = getMember(task.authorId);

  replaceContent(qs('#task-meta-status'), el('span', { className: `status-dot status-dot-${status.id}` }), ` ${status.label}`);

  replaceContent(
    qs('#task-meta-assignee'),
    assignee
      ? el(
        'a',
        { className: 'task-meta-person', href: 'team.html' },
        createAvatar(assignee, { className: 'task-meta-avatar' }),
        el('span', { className: 'task-meta-name' }, assignee.name),
        el('span', { className: 'task-meta-name-short' }, getShortName(assignee.name)),
      )
      : el('span', { className: 'task-meta-empty' }, 'Не назначен'),
  );

  qs('#task-meta-author').textContent = author?.name ?? FORMER_MEMBER;

  const due = qs('#task-meta-due');
  replaceContent(due, task.due ? createDate(task.due) : el('span', { className: 'task-meta-empty' }, 'Без срока'));
  due.classList.toggle('task-meta-value-overdue', isOverdue(task));

  replaceContent(qs('#task-meta-created'), createDate(task.createdAt));
  replaceContent(qs('#task-meta-priority'), createPriorityBadge(task));
  replaceContent(qs('#task-meta-tags'), task.tags.length ? task.tags.map(createTag) : el('span', { className: 'task-meta-empty' }, '—'));
}

function createComment(comment) {
  const author = getMember(comment.authorId);
  return el(
    'li',
    { className: 'comment', dataset: { commentId: comment.id } },
    createAvatar(author, { size: 'large', emptyLabel: FORMER_MEMBER }),
    el(
      'div',
      { className: 'comment-body' },
      el(
        'p',
        { className: 'comment-meta' },
        el('span', { className: 'comment-author' }, author?.name ?? FORMER_MEMBER),
        ' ',
        el('time', { className: 'comment-time', datetime: comment.createdAt }, formatDateTime(comment.createdAt)),
      ),
      el('p', { className: 'comment-text' }, comment.text),
    ),
  );
}

function renderComments(task) {
  const comments = getComments(task.id);
  qs('#task-comments-count').textContent = `· ${comments.length}`;
  replaceContent(
    qs('#task-comments'),
    comments.length ? comments.map(createComment) : el('li', { className: 'comment-empty' }, 'Пока никто не комментировал.'),
  );
}

export function init() {
  const task = findTask();
  if (!task) {
    renderNotFound();
    return;
  }

  const commentForm = qs('#comment-form');
  const commentText = qs('#comment-text');

  function render() {
    renderHeader(task);
    renderDescription(task);
    renderMeta(task);
    renderComments(task);
  }

  qs('#task-status').addEventListener('change', (event) => {
    if (!setTaskStatus(task.id, event.target.value)) return;
    render();
    showToast(`Статус: ${getStatus(task.status).label}`);
  });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = commentText.value.trim();
    if (!text) {
      commentText.focus();
      return;
    }
    const comment = addComment(task.id, text);
    commentText.value = '';
    renderComments(task);
    document.querySelector(`[data-comment-id="${comment.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  commentText.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      commentForm.requestSubmit();
    }
  });

  qs('#comment-form-avatar').replaceWith(
    createAvatar(getCurrentUser(), { size: 'large', className: 'comment-form-avatar' }),
  );
  render();
}
