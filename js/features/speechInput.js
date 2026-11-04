import { el, icon } from '../utils/dom.js';
import { showToast } from '../components/toast.js';

const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

const UNSUPPORTED_MESSAGE = 'Голосовой ввод не поддерживается в этом браузере — попробуйте Chrome, Edge или Safari';
const NO_MIC_ACCESS = 'Нет доступа к микрофону — разрешите его для этого сайта в настройках браузера';

const ERROR_MESSAGES = {
  'not-allowed': NO_MIC_ACCESS,
  'service-not-allowed': NO_MIC_ACCESS,
  'audio-capture': 'Микрофон не найден — подключите его и попробуйте ещё раз',
  'no-speech': 'Ничего не услышали — попробуйте ещё раз',
  network: 'Распознавание речи недоступно: нет связи с сервисом',
  'language-not-supported': 'Браузер не распознаёт русскую речь',
};

let session = null;

const isSpeechSupported = () => typeof Recognition === 'function' && window.isSecureContext;

function joinText(before, spoken) {
  if (!spoken) return before;
  const sentenceStart = !before || /[.!?]$/.test(before);
  const text = sentenceStart ? spoken[0].toUpperCase() + spoken.slice(1) : spoken;
  return before ? `${before} ${text}` : text;
}

function setRecording(button, isRecording) {
  button.classList.toggle('speech-button-recording', isRecording);
  button.setAttribute('aria-pressed', String(isRecording));
  button.title = isRecording ? 'Остановить запись' : 'Надиктовать голосом';
}

function start(field, button) {
  session?.recognition.abort();

  const recognition = new Recognition();
  const before = field.value.trimEnd();
  const maxLength = field.maxLength > 0 ? field.maxLength : Infinity;
  let finalText = '';

  recognition.lang = 'ru-RU';
  recognition.interimResults = true;
  recognition.continuous = field.tagName === 'TEXTAREA';

  recognition.addEventListener('result', (event) => {
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    field.value = joinText(before, `${finalText}${interim}`.trim()).slice(0, maxLength);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });

  recognition.addEventListener('error', (event) => {
    if (event.error === 'aborted') return;
    showToast(ERROR_MESSAGES[event.error] ?? 'Не удалось распознать речь — попробуйте ещё раз');
  });

  recognition.addEventListener('end', () => {
    setRecording(button, false);
    if (session?.recognition === recognition) session = null;
  });

  try {
    recognition.start();
  } catch {
    showToast('Не удалось включить микрофон — попробуйте ещё раз');
    return;
  }
  session = { recognition, button };
  setRecording(button, true);
  field.focus();
}

export function attachDictation(field, label) {
  const button = el(
    'button',
    { className: 'speech-button', type: 'button', 'aria-label': `Надиктовать ${label}`, 'aria-pressed': 'false', title: 'Надиктовать голосом' },
    icon('mic', 'md'),
  );
  const wrapper = el('div', { className: field.tagName === 'TEXTAREA' ? 'speech-field speech-field-multiline' : 'speech-field' });
  field.replaceWith(wrapper);
  wrapper.append(field, button);

  if (!isSpeechSupported()) {
    button.classList.add('speech-button-unavailable');
    button.title = 'Голосовой ввод недоступен в этом браузере';
    button.addEventListener('click', () => showToast(UNSUPPORTED_MESSAGE));
    return;
  }

  button.addEventListener('click', () => {
    if (session?.button === button) session.recognition.stop();
    else start(field, button);
  });
}

export function stopDictation() {
  session?.recognition.abort();
}
