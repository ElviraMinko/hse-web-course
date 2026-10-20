

export function pluralize(count, [one, few, many]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const TASK_WORDS = ['задача', 'задачи', 'задач'];
export const MEMBER_WORDS = ['участник', 'участника', 'участников'];

export function getInitials(name) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('');
  return letters.toUpperCase() || '?';
}

export function getShortName(name) {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

export function formatLastSeen(isoDateTime, now = new Date()) {
  if (!isoDateTime) return 'ещё не заходил(а)';
  const date = new Date(isoDateTime);
  const minutes = Math.floor((now - date) / 60_000);
  if (minutes < 5) return 'только что';
  if (minutes < 60) return `${minutes} ${pluralize(minutes, ['минуту', 'минуты', 'минут'])} назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 5) return `${hours} ${pluralize(hours, ['час', 'часа', 'часов'])} назад`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today - day) / 86_400_000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} ${pluralize(days, ['день', 'дня', 'дней'])} назад`;
}
