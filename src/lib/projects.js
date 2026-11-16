import { manualProjects, site } from './config.js';

const GITHUB_API_TIMEOUT = 5000;
const SITE_REPO = 'borbehr-dev.github.io';

const SNAPSHOT = [
  {
    name: 'vibe-bio',
    title: 'vibe-bio',
    description: 'AI-биография — небольшой эксперимент с генерацией описания о себе.',
    url: 'https://github.com/borbehr-dev/vibe-bio',
    homepage: 'https://borbehr-vibebio.pages.dev',
    language: 'JavaScript',
    category: 'AI / Web',
    topics: ['ai', 'bio'],
    updatedAt: '2026-11-11T22:24:45Z',
    featured: true,
  },
  {
    name: 'neon-rush',
    title: 'neon-rush',
    description:
      'Neon Rush (Неоновый забег) — неоновая аркадная игра для Android. HTML5 Canvas + JavaScript, упакованные в WebView. Один палец, бесконечная скорость.',
    url: 'https://github.com/borbehr-dev/neon-rush',
    homepage: '',
    language: 'Kotlin',
    category: 'Game / Android',
    topics: ['game', 'android'],
    updatedAt: '2026-11-08T14:49:39Z',
    featured: true,
  },
  {
    name: 'borbehr-dev.github.io',
    title: 'borbehr.eu.org',
    description: 'Исходники этого сайта: звук, проекты и цифровые эксперименты.',
    url: 'https://github.com/borbehr-dev/borbehr-dev.github.io',
    homepage: 'https://borbehr.eu.org',
    language: 'JavaScript',
    category: 'Website',
    topics: ['website', 'portfolio'],
    updatedAt: '2026-10-25T19:44:42Z',
    featured: false,
  },
  {
    name: 'Weltraumverteidiger',
    title: 'Weltraumverteidiger',
    description: 'Небольшой HTML-проект в открытом репозитории.',
    url: 'https://github.com/borbehr-dev/Weltraumverteidiger',
    homepage: '',
    language: 'HTML',
    category: 'Web',
    topics: [],
    updatedAt: '2026-10-19T19:49:52Z',
    featured: false,
  },
  {
    name: 'store',
    title: 'store',
    description: 'HTML-проект: витрина и эксперименты с интерфейсом.',
    url: 'https://github.com/borbehr-dev/store',
    homepage: '',
    language: 'HTML',
    category: 'Web',
    topics: [],
    updatedAt: '2026-10-16T10:39:19Z',
    featured: false,
  },
  {
    name: 'shuzagram_bot',
    title: 'shuzagram_bot',
    description: 'Python-бот в открытом репозитории.',
    url: 'https://github.com/borbehr-dev/shuzagram_bot',
    homepage: '',
    language: 'Python',
    category: 'Bot / Python',
    topics: [],
    updatedAt: '2026-10-09T11:58:51Z',
    featured: false,
  },
  {
    name: 'bio',
    title: 'bio',
    description: 'Персональная bio-страница проекта.',
    url: 'https://github.com/borbehr-dev/bio',
    homepage: 'https://borbehr-dev.github.io/bio/',
    language: 'HTML',
    category: 'Web',
    topics: ['bio'],
    updatedAt: '2026-06-07T17:42:49Z',
    featured: false,
  },
  {
    name: 'TodoList',
    title: 'TodoList',
    description: 'Список задач на TypeScript — небольшое веб-приложение.',
    url: 'https://github.com/borbehr-dev/TodoList',
    homepage: 'https://todolist.borbehr.eu.org',
    language: 'TypeScript',
    category: 'Web app',
    topics: ['todo', 'typescript'],
    updatedAt: '2026-06-05T17:49:01Z',
    featured: true,
  },
  {
    name: 'CloudFlare-Pinger',
    title: 'CloudFlare-Pinger',
    description: 'JavaScript-инструмент для работы с Cloudflare.',
    url: 'https://github.com/borbehr-dev/CloudFlare-Pinger',
    homepage: '',
    language: 'JavaScript',
    category: 'Tool / Web',
    topics: ['cloudflare', 'tool'],
    updatedAt: '2026-06-03T13:02:13Z',
    featured: false,
  },
  {
    name: 'Exorcist',
    title: 'Exorcist',
    description: 'Игра для Windows на Python.',
    url: 'https://github.com/borbehr-dev/Exorcist',
    homepage: '',
    language: 'Python',
    category: 'Game / Python',
    topics: ['games', 'windows'],
    updatedAt: '2026-05-15T15:08:45Z',
    featured: true,
  },
];

const ENRICHMENT = new Map(
  SNAPSHOT.map((project) => [
    project.name,
    {
      description: project.description,
      category: project.category,
      homepage: project.homepage,
      featured: project.featured,
    },
  ])
);

// Проекты, которые не показываем на сайте: устаревшая документация.
const HIDDEN_PROJECTS = new Set(['docs.borbehr.eu.org']);

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Живые адреса проектов, у которых старый домен или кривое поле homepage в GitHub.
const HOMEPAGE_OVERRIDES = {
  bio: 'https://borbehr-dev.github.io/bio/',
};

function sanitizeHomepage(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

function deriveCategory(repo) {
  const language = repo.language || 'Code';
  const topics = Array.isArray(repo.topics) ? repo.topics.map((topic) => topic.toLowerCase()) : [];

  if (topics.includes('game')) return `Game / ${language}`;
  if (topics.includes('docs')) return 'Docs';
  if (topics.includes('bot')) return 'Bot';
  if (language === 'HTML' || language === 'CSS') return 'Web';
  return language;
}

function normalizeProject(repo, source) {
  const name = String(repo.name || 'project');
  const enrichment = ENRICHMENT.get(name) || {};
  const rawDescription = typeof repo.description === 'string' ? repo.description.trim() : '';
  const homepage =
    HOMEPAGE_OVERRIDES[name] ?? sanitizeHomepage(enrichment.homepage ?? repo.homepage);

  return {
    name,
    title: name === SITE_REPO ? 'borbehr.eu.org' : name,
    description:
      enrichment.description || rawDescription || 'Открытый проект в репозитории на GitHub.',
    url: repo.html_url || `https://github.com/${site.githubUser}/${name}`,
    homepage,
    language: repo.language || 'Code',
    category: enrichment.category || deriveCategory(repo),
    topics: Array.isArray(repo.topics) ? repo.topics.filter(Boolean) : [],
    updatedAt: normalizeDate(repo.updated_at || repo.updatedAt),
    featured: Boolean(enrichment.featured),
    source,
  };
}

function sortProjects(projects) {
  return projects.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });
}

function projectFromManual(entry, index) {
  return {
    name: entry.title || entry.name || `project-${index + 1}`,
    title: entry.title || entry.name || `project-${index + 1}`,
    description: entry.desc || entry.description || 'Проект borBeHR.',
    url: entry.link || entry.url || site.githubUrl,
    homepage: sanitizeHomepage(entry.homepage),
    language: entry.language || 'Project',
    category: entry.category || 'Проект',
    topics: Array.isArray(entry.topics) ? entry.topics : [],
    updatedAt: normalizeDate(entry.updatedAt || entry.updated_at),
    featured: index < 4,
    source: 'manual',
  };
}

async function fetchGithubProjects() {
  if (typeof fetch !== 'function') return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_API_TIMEOUT);

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(site.githubUser)}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'borbehr.eu.org static build',
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

    const repos = await response.json();
    if (!Array.isArray(repos)) throw new Error('GitHub API: неожиданный формат ответа');

    return repos
      .filter((repo) => repo && !repo.fork && !repo.archived && !HIDDEN_PROJECTS.has(repo.name))
      .map((repo) => normalizeProject(repo, 'github'));
  } catch (error) {
    console.warn(`[projects] GitHub недоступен, использую локальный снимок: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadProjects() {
  if (manualProjects.length > 0) {
    return {
      items: sortProjects(manualProjects.map(projectFromManual)),
      source: 'manual',
      sourceLabel: 'Задано вручную',
    };
  }

  const live = await fetchGithubProjects();
  if (live && live.length > 0) {
    return {
      items: sortProjects(live),
      source: 'github',
      sourceLabel: 'GitHub API',
    };
  }

  return {
    items: sortProjects(SNAPSHOT.map((project) => normalizeProject(project, 'snapshot'))),
    source: 'snapshot',
    sourceLabel: 'Локальный снимок',
  };
}
