import fs from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { formatDuration, formatLongDuration, formatNumber } from './format.js';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.flac']);

const TRACK_META = {
  'Viper.mp3': {
    title: 'Viper',
    slug: 'viper',
    order: 1,
  },
  'Мой голос — закон.mp3': {
    title: 'Мой голос — закон',
    slug: 'moy-golos-zakon',
    order: 2,
  },
  'Кровавый_Bedrock.mp3': {
    title: 'Кровавый Bedrock',
    slug: 'krovavyy-bedrock',
    order: 3,
  },
  'linux-в-руках.mp3': {
    title: 'Linux в руках',
    slug: 'linux-v-rukah',
    order: 4,
  },
  'минт на максимум.mp3': {
    title: 'Минт на максимум',
    slug: 'mint-na-maksimum',
    order: 5,
  },
  'Свой Закон (V2).mp3': {
    title: 'Свой Закон (V2)',
    slug: 'svoy-zakon-v2',
    order: 6,
  },
  'Хулиган by borBeHR.mp3': {
    title: 'Хулиган',
    slug: 'huligan',
    order: 7,
  },
  'Картина_рук_Його.mp3': {
    title: 'Картина рук Його',
    slug: 'kartina-ruk-yogo',
    order: 8,
  },
};

const FEATURED = new Set(['viper', 'moy-golos-zakon', 'krovavyy-bedrock']);
const HUES = [74, 24, 164, 44, 198, 14, 96, 326, 62];

function titleFromFile(filename) {
  const base = filename.slice(0, -path.extname(filename).length);
  return base.replace(/[_-]+/g, ' ').trim();
}

function fallbackSlug(filename, index) {
  const base = filename
    .slice(0, -path.extname(filename).length)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `track-${index + 1}`;
}

function makeBars(seed) {
  return Array.from({ length: 44 }, (_, index) => {
    const value = (index * 37 + seed * 29 + index * index * 3) % 74;
    return 16 + value;
  });
}

function safelyEncodePath(filePath) {
  return encodeURI(`/audio/${filePath}`);
}

export async function loadTracks() {
  if (!fs.existsSync(AUDIO_DIR)) return [];

  const files = fs
    .readdirSync(AUDIO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  const rows = [];

  for (const [index, file] of files.entries()) {
    const meta = TRACK_META[file] || {};
    const fullPath = path.join(AUDIO_DIR, file);
    let duration = 0;

    try {
      const parsed = await parseFile(fullPath, { duration: true, skipCovers: true });
      duration = Number(parsed.format.duration) || 0;
    } catch (error) {
      console.warn(`[audio] Не удалось прочитать метаданные ${file}: ${error.message}`);
    }

    rows.push({
      title: meta.title || titleFromFile(file),
      slug: meta.slug || fallbackSlug(file, index),
      order: meta.order ?? 999,
      file,
      src: safelyEncodePath(file),
      duration,
      durationLabel: formatDuration(duration),
      featured: FEATURED.has(meta.slug),
      bars: makeBars(index + 1),
      hue: HUES[index % HUES.length],
      hue2: HUES[(index + 3) % HUES.length],
    });
  }

  rows.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'));

  return rows.map((track, index) => ({
    ...track,
    number: index + 1,
    numberLabel: formatNumber(index + 1),
  }));
}

export async function getTracksData() {
  const tracks = await loadTracks();
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const featured = tracks.filter((track) => track.featured);

  return {
    items: tracks,
    count: tracks.length,
    countLabel: formatNumber(tracks.length),
    totalDuration,
    totalDurationLabel: formatLongDuration(totalDuration),
    featured: featured.length ? featured : tracks.slice(0, 3),
  };
}
