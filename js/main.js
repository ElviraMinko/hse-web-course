import { watchStorageProblems } from './store.js';
import { renderLayout } from './components/layout.js';
import { showToast } from './components/toast.js';
import { watchDeadlines } from './features/deadlineReminders.js';

const pages = {
  board: () => import('./pages/board.js'),
  'task-form': () => import('./pages/taskForm.js'),
  task: () => import('./pages/taskDetails.js'),
  team: () => import('./pages/team.js'),
};

const STORAGE_MESSAGES = {
  unavailable: 'Браузер запретил сохранять данные — изменения пропадут после закрытия страницы',
  corrupted: 'Сохранённые данные повреждены, поэтому загружены демонстрационные',
  'save-failed': 'Не удалось сохранить изменения: хранилище браузера переполнено или отключено',
};

const shownProblems = new Set();

document.documentElement.classList.add('js');

watchStorageProblems((problem) => {
  if (shownProblems.has(problem) || (problem === 'save-failed' && shownProblems.has('unavailable'))) return;
  shownProblems.add(problem);
  showToast(STORAGE_MESSAGES[problem]);
});

renderLayout();
watchDeadlines();

pages[document.body.dataset.page]?.().then(({ init }) => init());
