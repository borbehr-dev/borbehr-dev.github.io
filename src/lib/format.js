const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export function formatDuration(value) {
  const total = Number(value);
  if (!Number.isFinite(total) || total <= 0) return '0:00';

  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function formatLongDuration(value) {
  const total = Math.round(Number(value) || 0);
  const minutes = Math.round(total / 60);

  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export function formatDateRu(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatNumber(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
