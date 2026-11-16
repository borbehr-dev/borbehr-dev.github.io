import { site } from '../lib/config.js';

const now = new Date();

export default {
  ...site,
  year: now.getFullYear(),
  buildDate: now.toISOString(),
  buildDateShort: now.toISOString().slice(0, 10),
  buildDateLabel: new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now),
};
