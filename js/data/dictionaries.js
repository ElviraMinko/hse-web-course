

export const STATUSES = [
  { id: 'backlog', label: 'Бэклог' },
  { id: 'progress', label: 'В работе' },
  { id: 'review', label: 'На ревью' },
  { id: 'done', label: 'Готово' },
];

export const PRIORITIES = [
  { id: 'high', label: 'Высокий' },
  { id: 'medium', label: 'Средний' },
  { id: 'low', label: 'Низкий' },
];

export const ROLES = [
  { id: 'admin', label: 'Администратор' },
  { id: 'member', label: 'Участник' },
  { id: 'viewer', label: 'Наблюдатель' },
];

export const BASE_TAGS = ['Фронтенд', 'Дизайн', 'Инфра', 'Баг', 'Фича', 'Документация'];

export const AVATAR_TONES = ['indigo', 'coral', 'green', 'amber', 'violet', 'cyan'];

export const TASK_TITLE_MIN = 3;
export const TASK_TITLE_MAX = 80;

export function getStatus(id) {
  return STATUSES.find((status) => status.id === id) ?? STATUSES[0];
}

export function getPriority(id) {
  return PRIORITIES.find((priority) => priority.id === id) ?? PRIORITIES[1];
}

export function getRole(id) {
  return ROLES.find((role) => role.id === id) ?? ROLES[1];
}
