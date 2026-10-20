

import { TASK_TITLE_MAX, getStatus } from '../data/dictionaries.js';
import { addTag, createTask, getCurrentUser, getMembers, getTags, getTask, updateTask } from '../store.js';
import { checkRadio, el, getQueryParam, qs, replaceContent } from '../utils/dom.js';
import { todayISO } from '../utils/date.js';
import { showFieldErrors, validateTask } from '../utils/validation.js';
import { setCurrentNavItem } from '../components/layout.js';
import { renderTaskCard } from '../components/taskCard.js';
import { queueToast, showToast } from '../components/toast.js';

const EMPTY_VALUES = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  assigneeId: null,
  due: '',
  tags: [],
};

const VALIDATED_FIELDS = ['title', 'due'];

export function init() {
  const form = qs('#task-form');
  const fields = form.elements;
  const tagOptions = qs('#tag-options');
  const newTagInput = qs('#new-tag-input');
  const preview = qs('#task-preview-card');

  const requestedId = getQueryParam('id');
  const task = requestedId ? getTask(requestedId) : null;
  const initialValues = task
    ? { ...EMPTY_VALUES, ...task, tags: [...task.tags] }
    : { ...EMPTY_VALUES, status: getStatus(getQueryParam('status')).id };
  const today = todayISO();
  let wasSubmitted = false;

  if (requestedId && !task) {
    showToast('Задача не найдена — можно создать новую');
  }


  function readValues() {
    const data = new FormData(form);
    return {
      title: data.get('title') ?? '',
      description: data.get('description') ?? '',
      status: data.get('status') ?? 'backlog',
      priority: data.get('priority') ?? 'medium',
      assigneeId: data.get('assignee') || null,
      due: data.get('due') ?? '',
      tags: data.getAll('tags'),
    };
  }

  function fillForm(values) {
    fields.namedItem('title').value = values.title;
    fields.namedItem('description').value = values.description;
    fields.namedItem('status').value = values.status;
    fields.namedItem('assignee').value = values.assigneeId ?? '';
    fields.namedItem('due').value = values.due;
    checkRadio(form, 'priority', values.priority);
    renderTagOptions(values.tags);
  }

  function renderAssigneeOptions() {
    const currentUser = getCurrentUser();
    const members = [...getMembers()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    replaceContent(
      fields.namedItem('assignee'),
      el('option', { value: '' }, 'Выберите участника'),
      members.map((member) => el('option', { value: member.id }, member.id === currentUser.id ? `${member.name} (вы)` : member.name)),
    );
  }

  function renderTagOptions(selectedTags) {

    const allTags = [...new Set([...getTags(), ...selectedTags])];
    replaceContent(
      tagOptions,
      allTags.map((tag) => el(
        'label',
        { className: 'tag-picker-option' },
        el('input', { className: 'visually-hidden', type: 'checkbox', name: 'tags', value: tag, checked: selectedTags.includes(tag) }),
        ` ${tag}`,
      )),
    );
  }


  function updateCounter() {
    qs('#title-counter').textContent = `${fields.namedItem('title').value.length} / ${TASK_TITLE_MAX}`;
  }

  function renderPreview() {
    const values = readValues();
    renderTaskCard(preview, { id: task?.id ?? 'preview', ...values }, { interactive: false });
    const status = getStatus(values.status);
    replaceContent(
      qs('#task-preview-column'),
      el('span', { className: `status-dot status-dot-${status.id}` }),
      ` Колонка «${status.label}»`,
    );
  }

  function validate() {
    const errors = validateTask(readValues(), { today, allowedDue: task?.due });
    return showFieldErrors(form, errors, VALIDATED_FIELDS);
  }

  function refresh() {
    updateCounter();
    renderPreview();

    if (wasSubmitted) validate();
  }

  function addCustomTag() {
    const name = newTagInput.value.trim();
    if (!name) {
      newTagInput.focus();
      return;
    }
    const tag = addTag(name);
    const selected = new Set(readValues().tags);
    selected.add(tag);
    renderTagOptions([...selected]);
    newTagInput.value = '';
    newTagInput.focus();
    renderPreview();
  }


  function setupEditMode() {
    const taskUrl = `task.html?id=${task.id}`;
    document.title = `Редактирование ${task.code} — Спринт`;
    qs('#form-heading').textContent = 'Редактирование задачи';
    replaceContent(
      qs('#form-breadcrumbs'),
      el('li', { className: 'breadcrumbs-item' }, el('a', { className: 'breadcrumbs-link', href: 'index.html' }, 'Доска')),
      el('li', { className: 'breadcrumbs-item' }, el('a', { className: 'breadcrumbs-link', href: taskUrl }, task.code)),
      el('li', { className: 'breadcrumbs-item', 'aria-current': 'page' }, 'Редактирование'),
    );
    qs('#form-submit').textContent = 'Сохранить изменения';
    qs('#form-reset').textContent = 'Сбросить';
    qs('#form-reset-mobile').textContent = 'Сбросить';
    qs('#form-cancel').href = taskUrl;
    qs('#form-back').href = taskUrl;
    qs('#form-back').setAttribute('aria-label', 'Отменить редактирование');
    setCurrentNavItem('index.html');
  }


  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  form.addEventListener('reset', (event) => {
    event.preventDefault();
    fillForm(initialValues);
    wasSubmitted = false;
    showFieldErrors(form, {}, VALIDATED_FIELDS);
    updateCounter();
    renderPreview();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    wasSubmitted = true;
    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const values = readValues();
    const saved = task ? updateTask(task.id, values) : createTask(values);
    queueToast(task ? 'Изменения сохранены' : `Задача ${saved.code} создана`);
    window.location.href = `task.html?id=${saved.id}`;
  });

  newTagInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCustomTag();
    }
  });
  qs('#new-tag-button').addEventListener('click', addCustomTag);


  if (task) setupEditMode();

  fields.namedItem('due').min = task?.due && task.due < today ? task.due : today;
  renderAssigneeOptions();
  fillForm(initialValues);
  updateCounter();
  renderPreview();
}
