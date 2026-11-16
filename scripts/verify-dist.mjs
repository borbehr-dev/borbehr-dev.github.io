// Проверка полноты собранного dist/.
// Ловит ситуацию, когда в сборку попала только часть файлов
// (CSS/JS/шрифты/страницы), а деплой уехал неполным.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const problems = [];

const REQUIRED = [
  'index.html',
  'about/index.html',
  'audio/index.html',
  'projects/index.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'favicon.svg',
  'favicon-32.png',
  'favicon-192.png',
  'apple-touch-icon.png',
  'og.png',
  '.nojekyll',
  'assets/css/global.css',
  'assets/js/site.js',
  'assets/js/audio.js',
  'assets/js/projects.js',
];

function exists(rel) {
  try {
    return fs.statSync(path.join(root, rel)).isFile();
  } catch {
    return false;
  }
}

for (const rel of REQUIRED) {
  if (!exists(rel)) problems.push(`нет файла: dist/${rel}`);
}

const fontsDir = path.join(root, 'assets', 'fonts');
const fonts = fs.existsSync(fontsDir)
  ? fs.readdirSync(fontsDir).filter((name) => name.endsWith('.woff2'))
  : [];
if (fonts.length < 4) {
  problems.push(`в dist/assets/fonts/ только ${fonts.length} woff2 (ожидалось минимум 4)`);
}

const audioDir = path.join(root, 'audio');
const mp3 = fs.existsSync(audioDir)
  ? fs.readdirSync(audioDir).filter((name) => name.endsWith('.mp3'))
  : [];
if (mp3.length === 0) problems.push('в dist/audio/ нет ни одного mp3');

// Все локальные ссылки из HTML и CSS должны существовать в dist/.
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
const toUrl = (file) => '/' + path.relative(root, file).split(path.sep).join('/');

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.css'].includes(ext)) continue;

  const source = fs.readFileSync(file, 'utf8');
  if (ext === '.html' && /{{|{%/.test(source)) {
    problems.push(`неотрендеренный шаблон в ${toUrl(file)}`);
  }

  const pattern = ext === '.html' ? /(?:href|src)="([^"]+)"/g : /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    const href = match[1].trim();
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;
    const target = path.join(root, decodeURIComponent(clean));
    const isFile = exists(decodeURIComponent(clean).replace(/^\//, ''));
    const isDir = fs.existsSync(target) && fs.statSync(target).isDirectory();
    if (!isFile && !isDir) {
      problems.push(`битая ссылка ${href} из ${toUrl(file)}`);
    }
  }
}

if (problems.length) {
  console.error('✗ dist/ неполный:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `✓ dist/ полный: ${files.length} файлов, ${mp3.length} mp3, ${fonts.length} шрифтов, проблем нет`,
);
