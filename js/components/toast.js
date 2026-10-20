

import { el } from '../utils/dom.js';

const VISIBLE_MS = 3200;
const QUEUE_KEY = 'sprint-tracker:toast';
let region = null;

export function showToast(message) {
  if (!region) {
    region = el('div', { className: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  const toast = el('p', { className: 'toast' }, message);
  region.append(toast);

  setTimeout(() => {
    toast.classList.add('toast-leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }, VISIBLE_MS);
}

export function queueToast(message) {
  try {
    sessionStorage.setItem(QUEUE_KEY, message);
  } catch {

  }
}

export function showQueuedToast() {
  try {
    const message = sessionStorage.getItem(QUEUE_KEY);
    if (message) {
      sessionStorage.removeItem(QUEUE_KEY);
      showToast(message);
    }
  } catch {

  }
}
