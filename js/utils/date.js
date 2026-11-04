import { pluralize } from './text.js';

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_LONG = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const DAY_MS = 86_400_000;

const pad = (value) => String(value).padStart(2, '0');
const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

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

export const todayISO = () => toISODate(new Date());
export const tomorrowISO = () => toISODate(addDays(new Date(), 1));

export function formatShortDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLongDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;
}

export function formatDateRange(startIso, endIso) {
  const sameMonth = parseISODate(startIso).getMonth() === parseISODate(endIso).getMonth();
  const start = sameMonth ? parseISODate(startIso).getDate() : formatLongDate(startIso);
  return `${start} — ${formatLongDate(endIso)}`;
}

function daysAgo(date, now) {
  const startOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
}

export function formatDateTime(isoDateTime, now = new Date()) {
  const date = new Date(isoDateTime);
  const days = daysAgo(date, now);
  if (days === 0) return `сегодня, ${formatTime(date)}`;
  if (days === 1) return `вчера, ${formatTime(date)}`;
  return `${formatLongDate(toISODate(date))}, ${formatTime(date)}`;
}

export function formatLastSeen(isoDateTime, now = new Date()) {
  if (!isoDateTime) return 'ещё не заходил(а)';
  const date = new Date(isoDateTime);
  const minutes = Math.floor((now - date) / 60_000);
  if (minutes < 5) return 'только что';
  if (minutes < 60) return `${minutes} ${pluralize(minutes, ['минуту', 'минуты', 'минут'])} назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 5) return `${hours} ${pluralize(hours, ['час', 'часа', 'часов'])} назад`;

  const days = daysAgo(date, now);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} ${pluralize(days, ['день', 'дня', 'дней'])} назад`;
}
