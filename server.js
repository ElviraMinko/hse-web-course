import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 3000;
const START_PAGE = '/html/index.html';
const START_ALIASES = new Set(['/', '/index.html', '/html', '/html/']);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' };

function sendText(response, status, text, headers = {}) {
  response.writeHead(status, { ...TEXT_HEADERS, ...headers }).end(text);
}

function parsePath(rawUrl) {
  try {
    const path = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
    return path.includes('\0') ? null : path;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Метод не поддерживается', { Allow: 'GET, HEAD' });
    return;
  }

  const path = parsePath(request.url);
  if (path === null) {
    sendText(response, 400, 'Некорректный адрес');
    return;
  }

  if (START_ALIASES.has(path)) {
    response.writeHead(302, { Location: START_PAGE }).end();
    return;
  }

  const filePath = normalize(join(ROOT, path));
  if (!filePath.startsWith(ROOT + sep)) {
    sendText(response, 403, 'Доступ запрещён');
    return;
  }

  let body;
  try {
    body = await readFile(filePath);
  } catch {
    sendText(response, 404, 'Не найдено');
    return;
  }

  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  response.end(request.method === 'HEAD' ? undefined : body);
});

server.listen(PORT, () => {
  console.log(`Спринт запущен: http://localhost:${PORT}`);
  console.log('Остановить — Ctrl+C');
});
