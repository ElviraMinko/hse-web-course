


import { createSeedData } from './data/seed.js';
import { AVATAR_TONES, BASE_TAGS, STATUSES, PRIORITIES, ROLES } from './data/dictionaries.js';
import { todayISO } from './utils/date.js';

const STORAGE_KEY = 'sprint-tracker';
const STORAGE_VERSION = 1;

let state = loadState() ?? createSeedData();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.version === STORAGE_VERSION ? saved.data : null;
  } catch {

    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: state }));
}


export const getSprint = () => state.sprint;
export const getTasks = () => state.tasks;
export const getTask = (id) => state.tasks.find((task) => task.id === id) ?? null;
export const getMembers = () => state.members;
export const getMember = (id) => state.members.find((member) => member.id === id) ?? null;
export const getCurrentUser = () => state.members.find((member) => member.isCurrentUser);
export const isCurrentUserAdmin = () => getCurrentUser()?.role === 'admin';

export function getTags() {
  return [...BASE_TAGS, ...state.customTags];
}

export function getComments(taskId) {
  return state.comments
    .filter((comment) => comment.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function countActiveTasks(memberId) {
  return state.tasks.filter((task) => task.assigneeId === memberId && task.status !== 'done').length;
}

export function getPreference(key) {
  return state.preferences[key];
}


function nextId(kind, prefix) {
  const number = state.counters[kind]++;
  return { number, id: `${prefix}${number}` };
}

const isKnown = (list, id) => list.some((item) => item.id === id);

function normalizeTaskFields(fields) {
  return {
    title: fields.title.trim(),
    description: fields.description.trim(),
    status: isKnown(STATUSES, fields.status) ? fields.status : 'backlog',
    priority: isKnown(PRIORITIES, fields.priority) ? fields.priority : 'medium',
    assigneeId: getMember(fields.assigneeId) ? fields.assigneeId : null,
    tags: [...new Set(fields.tags)],
    due: fields.due || '',
  };
}

export function createTask(fields) {
  const { number, id } = nextId('task', 't');
  const task = {
    id,
    code: `SPR-${number}`,
    authorId: getCurrentUser().id,
    createdAt: todayISO(),
    ...normalizeTaskFields(fields),
  };
  state.tasks.push(task);
  saveState();
  return task;
}

export function updateTask(id, fields) {
  const task = getTask(id);
  if (!task) return null;
  Object.assign(task, normalizeTaskFields(fields));
  saveState();
  return task;
}

export function setTaskStatus(id, status) {
  const task = getTask(id);
  if (!task || !isKnown(STATUSES, status) || task.status === status) return false;
  task.status = status;
  saveState();
  return true;
}

export function addComment(taskId, text) {
  const comment = {
    id: nextId('comment', 'c').id,
    taskId,
    authorId: getCurrentUser().id,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  state.comments.push(comment);
  saveState();
  return comment;
}

export function addTag(name) {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const existing = getTags().find((tag) => tag.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;
  state.customTags.push(trimmed);
  saveState();
  return trimmed;
}

export function inviteMember({ name, email }) {
  const { id, number } = nextId('member', 'm');
  const member = {
    id,
    name: name.trim().replace(/\s+/g, ' '),
    email: email.trim().toLowerCase(),
    role: 'member',
    tone: AVATAR_TONES[(number - 1) % AVATAR_TONES.length],
    lastSeenAt: null,
  };
  state.members.push(member);
  saveState();
  return member;
}

export function setMemberRole(id, role) {
  const member = getMember(id);
  if (!member || member.isCurrentUser || !isKnown(ROLES, role)) return false;
  member.role = role;
  saveState();
  return true;
}

export function removeMember(id) {
  const member = getMember(id);
  if (!member || member.isCurrentUser) return 0;
  state.members = state.members.filter((item) => item.id !== id);
  let unassigned = 0;
  for (const task of state.tasks) {
    if (task.assigneeId === id) {
      task.assigneeId = null;
      unassigned += 1;
    }
  }
  saveState();
  return unassigned;
}

export function setPreference(key, value) {
  state.preferences[key] = value;
  saveState();
}

export function resetData() {
  state = createSeedData();
  saveState();
}
