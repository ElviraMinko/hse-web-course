

import { ROLES, getRole } from '../data/dictionaries.js';
import {
  countActiveTasks, getMember, getMembers, getPreference, getTasks,
  inviteMember, isCurrentUserAdmin, removeMember, setMemberRole, setPreference,
} from '../store.js';
import { checkRadio, el, icon, qs, qsa, replaceContent } from '../utils/dom.js';
import { MEMBER_WORDS, TASK_WORDS, formatLastSeen, pluralize } from '../utils/text.js';
import { showFieldErrors, validateInvite } from '../utils/validation.js';
import { createAvatar } from '../components/avatar.js';
import { confirmAction } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
  tasks: (a, b) => countActiveTasks(a.id) - countActiveTasks(b.id) || a.name.localeCompare(b.name, 'ru'),
};
const DEFAULT_DIRECTION = { name: 'asc', tasks: 'desc' };
const INVITE_FIELDS = ['name', 'email'];

function createMemberRow(member) {
  const tasks = countActiveTasks(member.id);
  const isMe = Boolean(member.isCurrentUser);

  return el(
    'tr',
    { className: 'team-member', dataset: { memberId: member.id } },
    el(
      'td',
      { className: 'team-member-cell team-member-cell-person' },
      el(
        'div',
        { className: 'team-member-person' },
        createAvatar(member, { size: 'xlarge' }),
        el(
          'div',
          { className: 'team-member-identity' },
          el('span', { className: 'team-member-name' }, member.name, isMe && ' ', isMe && el('span', { className: 'member-badge' }, 'Вы')),
          el('a', { className: 'team-member-email', href: `mailto:${member.email}` }, member.email),
        ),
      ),
    ),
    el(
      'td',
      { className: 'team-member-cell team-member-cell-role' },
      el(
        'select',
        {
          className: 'input select role-select',
          'aria-label': `Роль: ${member.name}`,
          disabled: isMe,
          value: member.role,
          dataset: { roleFor: member.id },
        },
        ROLES.map((role) => el('option', { value: role.id }, role.label)),
      ),
    ),
    el(
      'td',
      { className: 'team-member-cell team-member-cell-tasks team-member-tasks' },
      String(tasks),
      el('span', { className: 'team-member-tasks-word' }, ` ${pluralize(tasks, TASK_WORDS)}`),
    ),
    el(
      'td',
      { className: 'team-member-cell team-member-cell-activity team-member-activity' },
      isMe ? 'в сети' : formatLastSeen(member.lastSeenAt),
    ),
    el(
      'td',
      { className: 'team-member-cell team-member-cell-actions team-member-actions' },
      !isMe && el(
        'button',
        {
          className: 'icon-button icon-button-danger',
          type: 'button',
          'aria-label': `Удалить ${member.name} из команды`,
          title: 'Удалить из команды',
          dataset: { removeMember: member.id },
        },
        icon('delete', 'md'),
      ),
    ),
  );
}

export function init() {
  const tableBody = qs('#team-members');
  const searchInput = qs('#team-search-input');
  const filterField = qs('#team-filter');
  const sortButtons = qsa('[data-sort]');

  let query = '';
  let sort = { key: 'name', direction: 'asc' };

  function getVisibleMembers() {
    const role = getPreference('teamFilter');
    const sorter = SORTERS[sort.key];
    return getMembers()
      .filter((member) => role === 'all' || member.role === role)
      .filter((member) => !query || member.name.toLowerCase().includes(query) || member.email.includes(query))
      .sort((a, b) => (sort.direction === 'asc' ? sorter(a, b) : sorter(b, a)));
  }

  function renderStats() {
    const members = getMembers();
    const activeTasks = getTasks().filter((task) => task.status !== 'done').length;
    qs('#team-stat-members').textContent = members.length;
    qs('#team-stat-admins').textContent = members.filter((member) => member.role === 'admin').length;
    qs('#team-stat-active').textContent = activeTasks;
    qs('#team-summary').textContent =
      `${members.length} ${pluralize(members.length, MEMBER_WORDS)} · ${activeTasks} ${pluralize(activeTasks, TASK_WORDS)} в работе`;
  }

  function renderSortState() {
    for (const button of sortButtons) {
      const isActive = button.dataset.sort === sort.key;
      const heading = button.closest('th');
      if (isActive) heading.setAttribute('aria-sort', sort.direction === 'asc' ? 'ascending' : 'descending');
      else heading.removeAttribute('aria-sort');
      qs('.team-table-sort-icon', button).textContent = isActive ? (sort.direction === 'asc' ? '↑' : '↓') : '↕';
    }
  }

  function render() {
    const members = getVisibleMembers();
    replaceContent(
      tableBody,
      members.length
        ? members.map(createMemberRow)
        : el('tr', {}, el('td', { className: 'team-table-empty', colspan: 5 }, 'Никого не нашли — попробуйте другой запрос или фильтр')),
    );
    renderStats();
    renderSortState();
  }


  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim().toLowerCase();
    render();
  });
  qs('#team-search').addEventListener('submit', (event) => event.preventDefault());

  filterField.addEventListener('change', (event) => {
    setPreference('teamFilter', event.target.value);
    render();
  });

  for (const button of sortButtons) {
    button.addEventListener('click', () => {
      const key = button.dataset.sort;
      sort = key === sort.key
        ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: DEFAULT_DIRECTION[key] };
      render();
    });
  }


  tableBody.addEventListener('change', (event) => {
    const select = event.target.closest('[data-role-for]');
    if (!select) return;
    const member = getMember(select.dataset.roleFor);
    if (setMemberRole(member.id, select.value)) {
      render();
      showToast(`${member.name}: роль изменена на «${getRole(member.role).label}»`);
    }
  });

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-remove-member]');
    if (!button) return;
    const member = getMember(button.dataset.removeMember);
    const tasks = getTasks().filter((task) => task.assigneeId === member.id).length;
    const confirmed = await confirmAction({
      title: 'Удалить из команды?',
      text: `${member.name} потеряет доступ к доске.` + (tasks
        ? ` ${tasks} ${pluralize(tasks, TASK_WORDS)} останутся без исполнителя.`
        : ''),
    });
    if (!confirmed) return;
    const unassigned = removeMember(member.id);
    render();
    showToast(unassigned ? `${member.name} удалён(а) · задач без исполнителя: ${unassigned}` : `${member.name} удалён(а) из команды`);
  });

  setupInviteDialog(render);

  checkRadio(filterField, 'role', getPreference('teamFilter'));
  render();
}


function setupInviteDialog(onInvited) {
  const dialog = qs('#invite-dialog');
  const form = qs('#invite-form');
  const openButton = qs('#team-invite-open');
  let wasSubmitted = false;

  const readValues = () => ({
    name: form.elements.namedItem('name').value,
    email: form.elements.namedItem('email').value,
  });
  const validate = () => showFieldErrors(form, validateInvite(readValues(), getMembers()), INVITE_FIELDS);

  function open() {
    if (!isCurrentUserAdmin() || dialog.open) return;
    dialog.showModal();
  }

  openButton.addEventListener('click', (event) => {
    event.preventDefault();
    open();
  });

  for (const closer of qsa('[data-close-dialog]', dialog)) {
    closer.addEventListener('click', (event) => {
      event.preventDefault();
      dialog.close();
    });
  }

  dialog.addEventListener('close', () => {
    form.reset();
    wasSubmitted = false;
    showFieldErrors(form, {}, INVITE_FIELDS);
  });

  form.addEventListener('input', () => {
    if (wasSubmitted) validate();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    wasSubmitted = true;
    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const member = inviteMember(readValues());
    dialog.close();
    onInvited();
    showToast(`Приглашение отправлено: ${member.name}, ${member.email}`);
  });

  if (window.location.hash === '#invite-dialog') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    open();
  }
}
