import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'config.yaml');

const DEFAULT_TELEGRAM = 'https://t.me/venbehr';
const DEFAULT_GITHUB_USER = 'borbehr-dev';
const DEFAULT_URL = 'https://borbehr.eu.org';

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};

  try {
    return yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8')) || {};
  } catch (error) {
    console.warn(`[config] Не удалось прочитать config.yaml: ${error.message}`);
    return {};
  }
}

function normalizeHandle(value) {
  if (!value) return '';
  return value.startsWith('@') ? value : `@${value}`;
}

function normalizeAlerts(rawAlerts) {
  if (!rawAlerts || typeof rawAlerts !== 'object') return [];

  return Object.entries(rawAlerts)
    .map(([key, value]) => {
      const alert = value && typeof value === 'object' ? value : {};
      return {
        id: String(key),
        text: typeof alert.text === 'string' ? alert.text.trim() : '',
        link: typeof alert.link === 'string' ? alert.link.trim() : '',
      };
    })
    .filter((alert) => alert.text)
    // Свежие объявления выше: новый алерт с большим id показывается первым.
    .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
}

const raw = readConfig();
const rawSite = raw.site && typeof raw.site === 'object' ? raw.site : {};
const githubUser = rawSite.github_user || DEFAULT_GITHUB_USER;
const telegramLink = rawSite.telegram_link || DEFAULT_TELEGRAM;
const siteUrl = String(rawSite.url || DEFAULT_URL).replace(/\/+$/, '');

export const site = {
  title: rawSite.title || 'borBeHR — portfolio',
  name: rawSite.name || 'borBeHR',
  url: siteUrl,
  description:
    rawSite.description ||
    'Независимый звук, код и цифровые эксперименты. Треки, проекты и контакт borBeHR.',
  locale: rawSite.locale || 'ru_RU',
  telegramLink,
  telegramHandle: normalizeHandle(rawSite.telegram_handle || telegramLink.split('/').pop()),
  githubUser,
  githubUrl: `https://github.com/${githubUser}`,
  notice: {
    title: rawSite.notice?.title || 'Все Telegram-каналы удалены.',
    text: rawSite.notice?.text || `Связь — только ${normalizeHandle(telegramLink.split('/').pop())}.`,
  },
  nav: [
    { label: 'Главная', href: '/', key: 'home' },
    { label: 'Звук', href: '/audio/', key: 'audio' },
    { label: 'Проекты', href: '/projects/', key: 'projects' },
    { label: 'О проекте', href: '/about/', key: 'about' },
  ],
};

export const manualProjects = Array.isArray(raw.projects) ? raw.projects : [];
export const alerts = normalizeAlerts(raw.alerts);
export { ROOT, CONFIG_PATH };
