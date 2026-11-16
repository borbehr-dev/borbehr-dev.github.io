# borbehr.eu.org

Новая версия сайта **borBeHR** — независимый звук, код и цифровые эксперименты.

Статический сайт без backend, аналитики, трекеров и обязательных внешних сервисов.
Собирается в обычные HTML/CSS/JS-файлы и одинаково хорошо работает на GitHub Pages
и Cloudflare Pages.

## Стек

- **Eleventy 3** — генератор статического сайта.
- **Nunjucks** — шаблоны, layouts, компоненты и макросы.
- **CSS** — собственная дизайн-система без фреймворков.
- **Vanilla JavaScript** — меню, аудиоплеер, фильтры, алерты.
- **Node.js 20+** — сборка.
- **sharp** — генерация favicon и OG-изображения (только при обновлении ассетов).
- **music-metadata** — чтение длительности MP3 во время сборки.

## Быстрый старт

Требуется Node.js 20 или новее.

```bash
npm install
npm run dev
```

Сайт откроется на `http://localhost:4321`.

### Команды

Полный список команд, проверок и типовых задач — в [`commands.md`](./commands.md).

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер Eleventy с live reload |
| `npm run build` | Очищает `dist/` и собирает production-версию |
| `npm run preview` | Локальный preview собранного `dist/` на `http://127.0.0.1:4173` |
| `npm run clean` | Удаляет `dist/` |
| `npm run assets:generate` | Пересоздаёт favicon PNG и `og.png` из `public/favicon.svg` |

Обычный сценарий проверки:

```bash
npm run build
npm run preview
```

## Структура проекта

```text
.
├── config.yaml                 # сайт, алерты, ручные проекты
├── eleventy.config.js          # настройки Eleventy и фильтры
├── public/                     # копируется в корень dist/ (аудио, иконки, OG)
│   ├── audio/                  # MP3-файлы
│   ├── favicon.svg
│   ├── favicon-32.png
│   ├── favicon-192.png
│   ├── apple-touch-icon.png
│   ├── og.png
│   ├── site.webmanifest
│   ├── _headers                # кеширование и заголовки для Cloudflare Pages
│   └── .nojekyll               # отключает Jekyll на GitHub Pages (резерв)
├── scripts/
│   ├── clean.mjs               # очистка dist/
│   ├── generate-assets.mjs     # sharp: favicon + OG
│   ├── verify-dist.mjs         # проверка полноты сборки (запускается в build)
│   └── serve.mjs               # preview-сервер с Range для MP3
└── src/
    ├── _data/                  # данные Eleventy (site, tracks, projects, alerts)
    ├── _includes/
    │   ├── components/         # UI-макросы, иконки, логотип
    │   ├── site-header.njk
    │   └── site-footer.njk
    ├── _layouts/base.njk       # общий каркас, SEO, OG, шрифты
    ├── assets/
    │   ├── css/global.css
    │   ├── fonts/*.woff2
    │   └── js/                 # site.js, audio.js, projects.js
    ├── lib/                    # конфиг, треки, проекты, форматирование
    ├── index.njk               # /
    ├── audio.njk               # /audio/
    ├── projects.njk            # /projects/
    ├── about.njk               # /about/
    ├── 404.njk                 # /404.html
    ├── robots.njk              # /robots.txt
    └── sitemap.njk             # /sitemap.xml
```

Production-сборка находится в **`dist/`**.

## Контент

### Сайт и контакты

Всё верхнеуровневое содержимое задаётся в `config.yaml`:

```yaml
site:
  title: "borBeHR — portfolio"
  name: "borBeHR"
  url: "https://borbehr.eu.org"
  description: "..."
  locale: "ru_RU"
  telegram_link: "https://t.me/venbehr"
  telegram_handle: "@venbehr"
  github_user: "borbehr-dev"

  notice:
    title: "Все Telegram-каналы удалены."
    text: "Связь — только @venbehr."
```

### Алерты

Закрываемые объявления вверху сайта:

```yaml
alerts:
  3:
    text: "Вышло обновление! vibe-bio получил огромное уведомление! Пожалуйста, проверьте README: там много чего добавлено из обновления!"
    link: "https://github.com/borbehr-dev/vibe-bio"
  2:
    text: "Демо vibe-bio"
    link: "https://borbehr-vibebio.pages.dev"
```

Ключ (`1`, `2`, ...) — стабильный id баннера. При закрытии id сохраняется в
`localStorage` под ключом `borbehr_dismissed_alerts`, поэтому баннер не появляется
снова у этого посетителя. Новый алерт — новый ключ. Чем больше id, тем выше
объявление: свежие показываются первыми.

### Проекты

По умолчанию `projects: []`, и во время сборки сайт запрашивает публичные
репозитории GitHub:

- запрос идёт на GitHub API с таймаутом 5 секунд;
- форки и архивные репозитории исключаются;
- если GitHub недоступен или отвечает ошибкой, используется встроенный снимок
  реальных проектов из `src/lib/projects.js`;
- описания, категории и ссылки на демо для известных репозиториев хранятся там же.

Чтобы задать список вручную, заполните `projects` в `config.yaml`:

```yaml
projects:
  - title: "Мой проект"
    description: "Короткое описание"
    url: "https://github.com/borbehr-dev/example"
    homepage: "https://example.pages.dev"
    language: "TypeScript"
    category: "Web app"
    topics: ["web", "tool"]
    updatedAt: "2026-01-01"
```

Если список непустой, GitHub API не используется.

### Аудио

1. Скопируйте файл в `public/audio/`.
2. Поддерживаются `mp3`, `ogg`, `wav`, `m4a`, `flac`.
3. При сборке длительность читается автоматически через `music-metadata`.
4. Название и slug можно задать в `src/lib/tracks.js` в объекте `TRACK_META`.
   Без записи в `TRACK_META` название берётся из имени файла.
5. Избранные треки для главной задаются там же в `FEATURED`.

Страница `/audio/` получает данные на этапе сборки: в HTML встраивается JSON,
а `audio.js` создаёт плеер. Поддерживаются play/pause, предыдущий/следующий трек,
перемотка, громкость, mute, shuffle, повтор всех/одного трека, скачивание,
поиск по архиву, клавиши `Space`, `←`, `→`, `M`, `N`, `P`, Media Session API и
запоминание последнего трека.

## Дизайн и возможности

- Тёмная тема по умолчанию, лаймовый акцент и оранжевые служебные маркеры.
- Шрифты Unbounded, Manrope и JetBrains Mono — self-hosted WOFF2.
- Адаптивная сетка: мобильное меню, перестройка плеера, карточек и футера.
- Sticky-header с индикатором прокрутки, reveal-анимации, hover-состояния.
- Аудиоплеер с доступными контролами, live-region для скринридеров и клавиатурой.
- Фильтр проектов по категории + поиск по названию, языку и темам.
- Поиск по трекам с пустым состоянием.
- SEO: canonical, Open Graph, Twitter Card, JSON-LD, `sitemap.xml`, `robots.txt`.
- Favicon SVG/PNG, Apple Touch Icon, web manifest, OG-картинка 1200×630.
- `prefers-reduced-motion`, skip-link, focus-visible, ARIA-атрибуты.
- Никаких сторонних скриптов, cookie, аналитики и запросов к CDN.

## Ассеты

`npm run assets:generate` создаёт из `public/favicon.svg`:

- `public/favicon-32.png`
- `public/favicon-192.png`
- `public/apple-touch-icon.png`
- `public/og.png` — социальная карточка 1200×630

Сгенерированные файлы уже лежат в репозитории, поэтому для обычной сборки
запускать эту команду не нужно. Она нужна только после изменения иконки или
дизайна OG-карточки.

## Сборка и деплой

Production-сборка:

```bash
npm ci
npm run build
```

Результат — каталог `dist/`. В конце сборки `scripts/verify-dist.mjs` проверяет,
что в `dist/` есть все страницы, CSS, JS, шрифты, иконки, `robots.txt`,
`sitemap.xml`, и что локальные ссылки не битые. Если файлов не хватает —
команда падает с ошибкой, а не публикует полусобранный сайт.

CSS и JS подключаются с хешем содержимого: `/assets/css/global.css?v=cccbc5ea`.
Хеш считается в сборке (фильтр `asset` в `eleventy.config.js`), поэтому после
деплоя браузеры и телефоны сразу берут новые файлы, а не старые из кеша.
`public/_headers` задаёт для Cloudflare Pages долгий кеш на `/assets/css/*` и
`/assets/js/*` и `nosniff` для всех ответов.

### Важно: `dist/` коммитится в репозиторий

Cloudflare Pages публикует содержимое **закоммиченного `dist/`**. Поэтому
каталог намеренно **не добавлен в `.gitignore`**: иначе новые файлы сборки
(`/assets/**`, `/about/`, `/robots.txt`, `/sitemap.xml`, иконки) остаются
untracked и не попадают в деплой — сайт открывается без CSS и JS, а все
неизвестные адреса отдают `index.html`.

После сборки `dist/` нужно добавить в коммит целиком:

```bash
npm run build
git add dist
git status          # убедиться, что новые файлы попали в индекс
git commit -m "build: обновление сайта"
git push
```

Проверка, что критичные файлы действительно попали в git:

```bash
git ls-files dist | Select-String "assets/css/global.css|about/index.html|robots.txt"
```

Должно вывести три строки. Без git то же самое проверяет `npm run verify`.

### Cloudflare Pages

Основной хостинг проекта:

- Build output directory: `dist`
- Build command: пусто (деплоится уже готовый закоммиченный `dist/`)
- Node.js version: `20`

Если включить в панели Build command `npm run build`, Cloudflare будет собирать
сайт сам при каждом пуше и коммитить `dist/` станет не нужно. Пока build
command пустой — деплой берёт `dist/` из репозитория.

После деплоя, если браузер/телефон держит старые файлы, очистите кеш:
Cloudflare Dashboard → Caching → Purge Everything (или Purge by URL для
`/assets/*`).

Backend, база данных и переменные окружения не требуются. Домен `borbehr.eu.org`
привязан к проекту Cloudflare Pages, поэтому `CNAME` в репозитории не нужен.

### GitHub Pages (резерв)

Workflow `.github/workflows/deploy.yml` устанавливает Node.js, выполняет
`npm ci` и `npm run build`, затем публикует `dist/`. Это резервный вариант
публикации — основной сайт живёт на Cloudflare Pages. При необходимости
домен для GitHub Pages настраивается в настройках репозитория, а не через
файл `CNAME`.

## Проверки

```bash
npm run build        # production-сборка + проверка полноты dist/
npm run verify       # только проверка уже собранного dist/
npm run preview      # локальная проверка dist/
npm audit            # зависимостей с известными уязвимостями нет
```

## Проверки

```bash
npm run build        # production-сборка
npm run preview      # локальная проверка dist/
npm audit            # зависимостей с известными уязвимостями нет
```
