

import { getRole } from '../data/dictionaries.js';
import { getCurrentUser, getSprint, isCurrentUserAdmin } from '../store.js';
import { el, qsa, replaceContent } from '../utils/dom.js';
import { formatDateRange } from '../utils/date.js';
import { createAvatar } from './avatar.js';
import { showQueuedToast } from './toast.js';

export function renderLayout() {
  const user = getCurrentUser();
  const sprint = getSprint();

  document.body.classList.toggle('page-role-admin', isCurrentUserAdmin());

  const sprintDates = document.getElementById('sprint-dates');
  if (sprintDates) sprintDates.textContent = formatDateRange(sprint.start, sprint.end);

  const userCard = document.getElementById('current-user');
  if (userCard) {
    replaceContent(
      userCard,
      createAvatar(user, { size: 'large' }),
      el(
        'p',
        { className: 'current-user-info' },
        el('span', { className: 'current-user-name' }, user.name),
        el('span', { className: 'current-user-role' }, getRole(user.role).label),
      ),
    );
  }

  showQueuedToast();
}

export function setCurrentNavItem(href) {
  for (const link of qsa('.app-nav-link')) {
    const isCurrent = link.getAttribute('href') === href;
    link.classList.toggle('app-nav-link-current', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
