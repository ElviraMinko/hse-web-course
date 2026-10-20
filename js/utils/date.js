

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_LONG = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const pad = (value) => String(value).padStart(2, '0');

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function todayISO() {
  return toISODate(new Date());
}

export function formatShortDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLongDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;
}

export function formatDateRange(startIso, endIso) {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} — ${formatLongDate(endIso)}`;
  }
  return `${formatLongDate(startIso)} — ${formatLongDate(endIso)}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(date, now) {
  return Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
}

const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export function formatDateTime(isoDateTime, now = new Date()) {
  const date = new Date(isoDateTime);
  const days = daysAgo(date, now);
  if (days === 0) return `сегодня, ${formatTime(date)}`;
  if (days === 1) return `вчера, ${formatTime(date)}`;
  return `${formatLongDate(toISODate(date))}, ${formatTime(date)}`;
}
