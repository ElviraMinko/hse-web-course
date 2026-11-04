import { getCurrentUser, getPreference, getTasks, setPreference } from '../store.js';
import { todayISO, tomorrowISO } from '../utils/date.js';
import { TASK_WORDS, countLabel } from '../utils/text.js';
import { showToast } from '../components/toast.js';

const MAX_LISTED_TASKS = 3;

const FALLBACK_REASONS = {
  unsupported: 'Браузер не умеет показывать системные уведомления',
  insecure: 'Системные уведомления работают только по https или на localhost',
  denied: 'Уведомления для этого сайта запрещены в настройках браузера',
  default: 'Разрешение на уведомления не выдано',
};

function getNotificationState() {
  if (!('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return Notification.permission;
}

const areRemindersEnabled = () => getPreference('reminders') === true;

async function enableReminders() {
  let state = getNotificationState();
  if (state === 'default') state = await Notification.requestPermission().catch(() => 'denied');
  setPreference('reminders', true);
  return state === 'granted'
    ? 'Напоминания о дедлайнах включены'
    : `${FALLBACK_REASONS[state]} — будем напоминать внутри приложения`;
}

function findUrgentTasks() {
  const userId = getCurrentUser().id;
  const tomorrow = tomorrowISO();
  return getTasks()
    .filter((task) => task.assigneeId === userId && task.status !== 'done' && task.due && task.due <= tomorrow)
    .sort((a, b) => a.due.localeCompare(b.due));
}

function describeDue(task, today) {
  if (task.due < today) return 'дедлайн прошёл';
  return task.due === today ? 'дедлайн сегодня' : 'дедлайн завтра';
}

function buildReminder(tasks, today) {
  if (tasks.length === 1) {
    const [task] = tasks;
    return { title: `${task.code}: ${describeDue(task, today)}`, body: task.title, url: `task.html?id=${task.id}` };
  }
  const lines = tasks.slice(0, MAX_LISTED_TASKS).map((task) => `• ${task.title} — ${describeDue(task, today)}`);
  const rest = tasks.length - MAX_LISTED_TASKS;
  if (rest > 0) lines.push(`и ещё ${countLabel(rest, TASK_WORDS)}`);
  return { title: `${countLabel(tasks.length, TASK_WORDS)} с близким дедлайном`, body: lines.join('\n'), url: 'index.html?filter=mine' };
}

function showSystemNotification({ title, body, url }) {
  if (getNotificationState() !== 'granted') return false;
  try {
    const notification = new Notification(title, { body, tag: 'sprint-deadlines', lang: 'ru' });
    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
      window.location.href = url;
    });
    return true;
  } catch {
    return false;
  }
}

function checkDeadlines({ force = false } = {}) {
  if (!areRemindersEnabled()) return;

  const today = todayISO();
  const remindedOn = getPreference('remindedOn') ?? {};
  const tasks = findUrgentTasks().filter((task) => force || remindedOn[task.id] !== today);

  if (!tasks.length) {
    if (force) showToast('Срочных задач нет');
    return;
  }

  const reminder = buildReminder(tasks, today);
  if (!showSystemNotification(reminder)) {
    showToast(`Напоминание · ${reminder.title}${tasks.length === 1 ? `: «${reminder.body}»` : ''}`);
  }
  setPreference('remindedOn', Object.fromEntries(tasks.map((task) => [task.id, today])));
}

export function watchDeadlines() {
  checkDeadlines();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkDeadlines();
  });
}

export function setupReminderToggle(button) {
  function render() {
    const enabled = areRemindersEnabled();
    let label = 'Включить напоминания о дедлайнах';
    if (enabled) {
      label = getNotificationState() === 'granted'
        ? 'Напоминания включены. Нажмите, чтобы выключить'
        : 'Напоминания включены внутри приложения. Нажмите, чтобы выключить';
    }
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  button.addEventListener('click', async () => {
    if (areRemindersEnabled()) {
      setPreference('reminders', false);
      render();
      showToast('Напоминания выключены');
      return;
    }
    button.disabled = true;
    const message = await enableReminders();
    button.disabled = false;
    render();
    showToast(message);
    checkDeadlines({ force: true });
  });

  render();
}
