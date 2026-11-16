import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  return path.join(root, normalized);
}

async function resolveFile(urlPath) {
  const candidate = safePath(urlPath);
  if (!candidate.startsWith(root)) return null;

  try {
    const stat = await fsp.stat(candidate);
    if (stat.isFile()) return { file: candidate, stat };

    if (stat.isDirectory()) {
      const index = path.join(candidate, 'index.html');
      const indexStat = await fsp.stat(index);
      if (indexStat.isFile()) return { file: index, stat: indexStat };
    }
  } catch {
    /* Try an extensionless HTML file below. */
  }

  if (!path.extname(candidate)) {
    const html = `${candidate}.html`;
    try {
      const stat = await fsp.stat(html);
      if (stat.isFile()) return { file: html, stat };
    } catch {
      /* Not found. */
    }
  }

  return null;
}

function sendFile(request, response, file, stat, statusCode = 200) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';

  const headers = {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
  };

  const range = request.headers.range;
  if (range && ext === '.mp3') {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;

      if (start <= end && start < stat.size) {
        response.writeHead(206, {
          ...headers,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(response);
        return;
      }
    }
  }

  response.writeHead(statusCode, {
    ...headers,
    'Content-Length': stat.size,
    'Accept-Ranges': ext === '.mp3' ? 'bytes' : 'none',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(file).pipe(response);
}

const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  try {
    const urlPath = request.url || '/';
    const resolved = await resolveFile(urlPath);

    if (resolved) {
      sendFile(request, response, resolved.file, resolved.stat);
      return;
    }

    const notFound = path.join(root, '404.html');
    try {
      const stat = await fsp.stat(notFound);
      sendFile(request, response, notFound, stat, 404);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('404 — страница не найдена. Сначала выполните npm run build.');
    }
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('500 — внутренняя ошибка preview-сервера.');
  }
});

server.listen(port, host, () => {
  console.log(`Preview: http://${host}:${port}`);
  console.log(`Каталог: ${root}`);
});
