import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 3000;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');

  if (pathname === '/') {
    response.writeHead(302, { Location: '/html/index.html' }).end();
    return;
  }

  const filePath = normalize(join(ROOT, decodeURIComponent(pathname)));

  try {
    if (!filePath.startsWith(ROOT)) throw new Error('Forbidden');
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Не найдено');
  }
}).listen(PORT, () => {
  console.log(`Спринт запущен: http://localhost:${PORT}`);
});
