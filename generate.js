// Статический генератор сайта borbehr.eu.org.
// Node.js-версия того, что раньше делали generate.go + serve.go.
// Весь конфиг (раньше: go.mod + projects.yml) теперь в одном config.yaml.

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const yaml = require('js-yaml');

const ROOT = __dirname;
const CONFIG_FILE = path.join(ROOT, 'config.yaml');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST_DIR = path.join(ROOT, 'dist');

const AUDIO_EXTS = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.flac']);
const DEFAULT_GITHUB_USER = 'borbehr-dev';
const DEFAULT_TELEGRAM_LINK = 'https://t.me/venbehr';
const DEFAULT_TITLE = 'borBeHR — portfolio';

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('config.yaml не найден — использую дефолты и режим авто-фетча с GitHub');
    return { site: {}, projects: [], alerts: {} };
  }

  let raw;
  try {
    raw = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
  } catch (err) {
    console.error('config.yaml повреждён, игнорирую:', err.message);
    return { site: {}, projects: [], alerts: {} };
  }

  return {
    site: raw.site || {},
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    alerts: raw.alerts || {},
  };
}

// alerts в config.yaml задаются как объект с произвольными ключами (1, 2, "new-feature"...)
// ключ становится id алерта и используется на клиенте для localStorage-пометки "закрыт".
function normalizeAlerts(alertsObj) {
  return Object.keys(alertsObj)
    .sort()
    .map((key) => {
      const a = alertsObj[key] || {};
      return {
        id: String(key),
        text: a.text || '',
        link: a.link || '',
      };
    })
    .filter((a) => a.text);
}

function titleFromFilename(name) {
  const base = name.slice(0, -path.extname(name).length);
  return base.replace(/_/g, ' ').replace(/-/g, ' ').trim();
}

function generateTracklist(audioDir, outPath) {
  let tracks = [];

  if (fs.existsSync(audioDir)) {
    const names = fs
      .readdirSync(audioDir, { withFileTypes: true })
      .filter((e) => e.isFile() && AUDIO_EXTS.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort();

    tracks = names.map((n) => ({
      title: titleFromFilename(n),
      src: '/audio/' + n,
    }));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(tracks, null, 2));
  console.log('Найдено треков:', tracks.length);
}

function copyStatic(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyStatic(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function renderPage(contentTemplate, outPath, data) {
  const body = ejs.render(
    fs.readFileSync(path.join(TEMPLATES_DIR, contentTemplate), 'utf8'),
    data,
    { filename: path.join(TEMPLATES_DIR, contentTemplate) }
  );

  const html = ejs.render(
    fs.readFileSync(path.join(TEMPLATES_DIR, 'layout.ejs'), 'utf8'),
    Object.assign({}, data, { body }),
    { filename: path.join(TEMPLATES_DIR, 'layout.ejs') }
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const cfg = loadConfig();
  const site = cfg.site;

  const base = {
    title: site.title || DEFAULT_TITLE,
    telegramLink: site.telegram_link || DEFAULT_TELEGRAM_LINK,
    githubUser: site.github_user || DEFAULT_GITHUB_USER,
    hasManual: cfg.projects.length > 0,
    projects: cfg.projects,
    alerts: normalizeAlerts(cfg.alerts),
  };

  renderPage('home.ejs', path.join(DIST_DIR, 'index.html'), Object.assign({}, base, { page: 'home', title: base.title }));

  renderPage('audio.ejs', path.join(DIST_DIR, 'audio', 'index.html'), Object.assign({}, base, { page: 'audio', title: 'audio — ' + base.title.split(' — ')[0] }));

  renderPage('projects.ejs', path.join(DIST_DIR, 'projects', 'index.html'), Object.assign({}, base, { page: 'projects', title: 'projects — ' + base.title.split(' — ')[0] }));

  copyStatic(STATIC_DIR, DIST_DIR);
  generateTracklist(path.join(STATIC_DIR, 'audio'), path.join(DIST_DIR, 'audio', 'tracks.json'));

  console.log('Готово. Статика лежит в dist/');
}

main();
