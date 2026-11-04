import { el } from '../utils/dom.js';

const VISIBLE_MS = 3200;
const QUEUE_KEY = 'sprint-tracker:toast';
let region = null;

export function showToast(message) {
  region ??= document.body.appendChild(el('div', { className: 'toast-region', role: 'status', 'aria-live': 'polite' }));
  const toast = el('p', { className: 'toast' }, message);
  region.append(toast);

  setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 250);
  }, VISIBLE_MS);
}

export function queueToast(message) {
  try {
    sessionStorage.setItem(QUEUE_KEY, message);
    return true;
  } catch {
    return false;
  }
}

function takeQueuedMessage() {
  try {
    const message = sessionStorage.getItem(QUEUE_KEY);
    sessionStorage.removeItem(QUEUE_KEY);
    return message;
  } catch {
    return null;
  }
}

export function showQueuedToast() {
  const message = takeQueuedMessage();
  if (message) showToast(message);
}
