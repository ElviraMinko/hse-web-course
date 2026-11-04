import { getPriority, getStatus } from '../data/dictionaries.js';
import { findDataProblem, normalizeData } from '../data/schema.js';
import { getMember, getSnapshot, getTasks } from '../store.js';
import { todayISO } from '../utils/date.js';

const APP_ID = 'sprint-tracker';
const FORMAT_VERSION = 1;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export class BackupError extends Error {}

export function createBackupFile() {
  const payload = { app: APP_ID, version: FORMAT_VERSION, exportedAt: new Date().toISOString(), data: getSnapshot() };
  return {
    blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    filename: `sprint-backup-${todayISO()}.json`,
  };
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function createTasksCsvFile() {
  const header = ['Код', 'Название', 'Статус', 'Приоритет', 'Исполнитель', 'Теги', 'Дедлайн', 'Создана', 'Описание'];
  const rows = getTasks().map((task) => [
    task.code,
    task.title,
    getStatus(task.status).label,
    getPriority(task.priority).label,
    getMember(task.assigneeId)?.name ?? '',
    task.tags.join(', '),
    task.due,
    task.createdAt,
    task.description,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  return {
    blob: new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }),
    filename: `sprint-tasks-${todayISO()}.csv`,
  };
}

export function downloadFile({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readBackupFile(file) {
  if (!file) throw new BackupError('Файл не выбран');
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    throw new BackupError('Нужен файл .json — резервная копия, скачанная из «Спринта»');
  }
  if (file.size === 0) throw new BackupError('Файл пустой');
  if (file.size > MAX_FILE_SIZE) throw new BackupError('Файл больше 2 МБ — это не похоже на резервную копию «Спринта»');

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new BackupError('Не удалось прочитать файл: он повреждён или это не JSON');
  }

  if (payload?.app !== APP_ID) throw new BackupError('Это не резервная копия «Спринта»');
  if (payload.version !== FORMAT_VERSION) throw new BackupError('Копия сделана в другой версии приложения');

  const problem = findDataProblem(payload.data);
  if (problem) throw new BackupError(`Резервная копия повреждена: ${problem}`);

  const data = normalizeData(payload.data);
  return {
    data,
    summary: {
      tasks: data.tasks.length,
      members: data.members.length,
      comments: data.comments.length,
      exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : null,
    },
  };
}
