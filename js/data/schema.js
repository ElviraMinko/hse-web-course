import { AVATAR_TONES, PRIORITIES, ROLES, STATUSES, isKnown } from './dictionaries.js';

const isString = (value) => typeof value === 'string';
const isStringList = (value) => Array.isArray(value) && value.every(isString);
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function findDataProblem(data) {
  if (!isPlainObject(data)) return 'нет данных';
  for (const key of ['tasks', 'members', 'comments']) {
    if (!Array.isArray(data[key])) return `нет списка «${key}»`;
  }
  if (!isString(data.sprint?.start) || !isString(data.sprint?.end)) return 'нет дат спринта';

  for (const member of data.members) {
    if (!isString(member?.id) || !isString(member.name) || !isString(member.email) || !isKnown(ROLES, member.role)) {
      return 'участник записан с ошибкой';
    }
  }
  if (data.members.filter((member) => member.isCurrentUser).length !== 1) return 'не указан текущий пользователь';

  const memberIds = new Set(data.members.map((member) => member.id));
  for (const task of data.tasks) {
    if (!isString(task?.id) || !isString(task.code) || !isString(task.title) || !task.title.trim()) return 'задача без названия';
    if (!isKnown(STATUSES, task.status) || !isKnown(PRIORITIES, task.priority)) return `у задачи «${task.title}» неизвестный статус или приоритет`;
    if (!isStringList(task.tags)) return `у задачи «${task.title}» неверные теги`;
    if (!isString(task.createdAt)) return `у задачи «${task.title}» нет даты создания`;
    if (task.assigneeId && !memberIds.has(task.assigneeId)) return `у задачи «${task.title}» неизвестный исполнитель`;
  }

  const taskIds = new Set(data.tasks.map((task) => task.id));
  for (const comment of data.comments) {
    if (!taskIds.has(comment?.taskId) || !isString(comment.text) || !isString(comment.createdAt)) return 'комментарий записан с ошибкой';
  }
  return null;
}

const maxNumber = (values, pattern) => Math.max(0, ...values.map((value) => Number(pattern.exec(value)?.[1] ?? 0)));
const counter = (saved, used) => Math.max(Number.isInteger(saved) ? saved : 0, used + 1);

export function normalizeData(data) {
  return {
    sprint: data.sprint,
    members: data.members.map((member, index) => ({
      lastSeenAt: null,
      ...member,
      tone: AVATAR_TONES.includes(member.tone) ? member.tone : AVATAR_TONES[index % AVATAR_TONES.length],
    })),
    tasks: data.tasks.map((task) => ({
      ...task,
      description: isString(task.description) ? task.description : '',
      due: isString(task.due) ? task.due : '',
      assigneeId: task.assigneeId || null,
    })),
    comments: data.comments,
    customTags: isStringList(data.customTags) ? data.customTags : [],
    preferences: { boardFilter: 'all', boardTab: 'progress', teamFilter: 'all', ...(isPlainObject(data.preferences) ? data.preferences : {}) },
    counters: {
      task: counter(data.counters?.task, maxNumber(data.tasks.map((task) => task.code), /(\d+)$/)),
      member: counter(data.counters?.member, maxNumber(data.members.map((member) => member.id), /^m(\d+)$/)),
      comment: counter(data.counters?.comment, maxNumber(data.comments.map((comment) => comment.id), /^c(\d+)$/)),
    },
  };
}
