

import { renderLayout } from './components/layout.js';

const pages = {
  board: () => import('./pages/board.js'),
  'task-form': () => import('./pages/taskForm.js'),
  task: () => import('./pages/taskDetails.js'),
  team: () => import('./pages/team.js'),
};

document.documentElement.classList.add('js');

renderLayout();

const loadPage = pages[document.body.dataset.page];
if (loadPage) {
  loadPage().then(({ init }) => init());
}
