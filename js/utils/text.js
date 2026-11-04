export function pluralize(count, [one, few, many]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const TASK_WORDS = ['задача', 'задачи', 'задач'];
export const MEMBER_WORDS = ['участник', 'участника', 'участников'];
export const COMMENT_WORDS = ['комментарий', 'комментария', 'комментариев'];

export const countLabel = (count, words) => `${count} ${pluralize(count, words)}`;

export function getInitials(name) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('');
  return initials.toUpperCase() || '?';
}

export function getShortName(name) {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}
