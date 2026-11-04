import { TASK_TITLE_MIN, TASK_TITLE_MAX } from '../data/dictionaries.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateTask(values, { today, allowedDue = '' }) {
  const errors = {};
  const title = values.title.trim();

  if (!title) errors.title = 'Добавьте название задачи';
  else if (title.length < TASK_TITLE_MIN) errors.title = `Слишком коротко — хотя бы ${TASK_TITLE_MIN} символа`;
  else if (title.length > TASK_TITLE_MAX) errors.title = `Название не длиннее ${TASK_TITLE_MAX} символов`;

  if (values.due && values.due < today && values.due !== allowedDue) {
    errors.due = 'Дедлайн не может быть в прошлом';
  }
  return errors;
}

export function validateInvite(values, members) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();

  if (!name) errors.name = 'Введите имя';
  else if (name.length < 2) errors.name = 'Имя слишком короткое — хотя бы 2 символа';

  if (!email) errors.email = 'Введите email';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Похоже, в адресе опечатка';
  else if (members.some((member) => member.email.toLowerCase() === email)) errors.email = 'Этот человек уже в команде';

  return errors;
}

function showFieldErrors(form, errors, fieldNames) {
  let firstInvalid = null;
  for (const name of fieldNames) {
    const input = form.elements.namedItem(name);
    const message = errors[name];
    input.closest('.form-field').classList.toggle('form-field-invalid', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) {
      document.getElementById(input.getAttribute('aria-describedby')).textContent = message;
      firstInvalid ??= input;
    }
  }
  return firstInvalid;
}

export function setupFormValidation(form, fieldNames, getErrors) {
  let wasSubmitted = false;
  const check = () => showFieldErrors(form, getErrors(), fieldNames);

  form.addEventListener('input', () => {
    if (wasSubmitted) check();
  });

  return {
    validate() {
      wasSubmitted = true;
      const firstInvalid = check();
      firstInvalid?.focus();
      return !firstInvalid;
    },
    clear() {
      wasSubmitted = false;
      showFieldErrors(form, {}, fieldNames);
    },
  };
}
