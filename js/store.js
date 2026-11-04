import { createSeedData } from './data/seed.js';
import { findDataProblem, normalizeData } from './data/schema.js';
import { AVATAR_TONES, BASE_TAGS, PRIORITIES, ROLES, STATUSES, isKnown } from './data/dictionaries.js';
import { todayISO } from './utils/date.js';

const STORAGE_KEY = 'sprint-tracker';
const BROKEN_COPY_KEY = 'sprint-tracker:broken';
const STORAGE_VERSION = 1;

let storageProblem = null;
let problemListener = null;
let state = loadState();

function reportProblem(problem) {
  storageProblem = problem;
  problemListener?.(problem);
}

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    reportProblem('unavailable');
    return null;
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function loadState() {
  const raw = readSaved();
  if (raw === null) return createSeedData();

  const saved = parseJson(raw);
  if (saved?.version === STORAGE_VERSION && !findDataProblem(saved.data)) return normalizeData(saved.data);

  writeStorage(BROKEN_COPY_KEY, raw);
  reportProblem('corrupted');
  const seed = createSeedData();
  persist(seed);
  return seed;
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function persist(data) {
  return writeStorage(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data }));
}

function saveState() {
  const saved = persist(state);
  if (!saved) reportProblem('save-failed');
  return saved;
}

export function watchStorageProblems(listener) {
  problemListener = listener;
  if (storageProblem) listener(storageProblem);
}

export const getSprint = () => state.sprint;
export const getTasks = () => state.tasks;
export const getTask = (id) => state.tasks.find((task) => task.id === id) ?? null;
export const getMembers = () => state.members;
export const getMember = (id) => state.members.find((member) => member.id === id) ?? null;
export const getCurrentUser = () => state.members.find((member) => member.isCurrentUser);
export const isCurrentUserAdmin = () => getCurrentUser().role === 'admin';
export const getTags = () => [...BASE_TAGS, ...state.customTags];
export const getPreference = (key) => state.preferences[key];
export const getSnapshot = () => structuredClone(state);

export function getComments(taskId) {
  return state.comments
    .filter((comment) => comment.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function countActiveTasks(memberId) {
  return state.tasks.filter((task) => task.assigneeId === memberId && task.status !== 'done').length;
}

function nextNumber(kind) {
  return state.counters[kind]++;
}

const tidy = (text) => text.trim().replace(/\s+/g, ' ');

function normalizeTask(fields) {
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
  const number = nextNumber('task');
  const task = {
    id: `t${number}`,
    code: `SPR-${number}`,
    authorId: getCurrentUser().id,
    createdAt: todayISO(),
    ...normalizeTask(fields),
  };
  state.tasks.push(task);
  saveState();
  return task;
}

export function updateTask(id, fields) {
  const task = getTask(id);
  Object.assign(task, normalizeTask(fields));
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
    id: `c${nextNumber('comment')}`,
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
  const tag = tidy(name);
  const existing = getTags().find((item) => item.toLowerCase() === tag.toLowerCase());
  if (existing) return existing;
  state.customTags.push(tag);
  saveState();
  return tag;
}

export function inviteMember({ name, email }) {
  const number = nextNumber('member');
  const member = {
    id: `m${number}`,
    name: tidy(name),
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
  if (getMember(id)?.isCurrentUser) return 0;
  state.members = state.members.filter((member) => member.id !== id);
  const freed = state.tasks.filter((task) => task.assigneeId === id);
  for (const task of freed) task.assigneeId = null;
  saveState();
  return freed.length;
}

export function setPreference(key, value) {
  state.preferences[key] = value;
  saveState();
}

export function resetData() {
  state = createSeedData();
  return saveState();
}

export function replaceAllData(data) {
  const copy = structuredClone(data);
  if (!persist(copy)) return false;
  state = copy;
  return true;
}
