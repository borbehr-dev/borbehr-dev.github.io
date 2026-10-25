# borbehr.eu.org

Весь исходный код сайта https://borbehr.eu.org/

Node.js-версия генератора (раньше был Go: `generate.go` + `serve.go` + `projects.yml`).
Теперь всё в одном `config.yaml` — сайт, проекты и закрываемые алерты.

## Запуск

```bash
npm install
npm run build   # рендерит templates/ + static/ → dist/
npm run serve   # локальный сервер на http://localhost:8000
# или сразу оба шага:
npm start
```

## Структура

- `config.yaml` — **единый конфиг**: `site` (заголовок, telegram, github_user),
  `projects` (список проектов портфолио; если пуст — сайт сам подтянет репозитории
  с GitHub API прямо в браузере), `alerts` (закрываемые баннеры наверху).
- `generate.js` — рендерит `templates/*.ejs` + копирует `static/` → `dist/`,
  сканирует `static/audio/` и генерирует `dist/audio/tracks.json`.
- `serve.js` — простой локальный статический сервер без зависимостей.
- `templates/` — layout + страницы (home, audio, projects) на EJS.
- `static/` — css, js (`player.js`, `github-fetch.js`, `alerts.js`), аудио-файлы.

## Алерты

```yaml
alerts:
  1:
    text: "Вышел новый проект! Обязательно посмотрите!"
    link: "https://borbehr-vibebio.pages.dev"
  2:
    text: "Просто текстовый алерт без ссылки"
```

Ключ (`1`, `2`, ...) — это id баннера. Когда посетитель закрывает баннер (кнопка ×),
`static/alerts.js` запоминает id в `localStorage`, и при следующем визите этот
баннер уже не покажется. Новый алерт — новый ключ — снова покажется всем.

## Деплой

GitHub Actions (`.github/workflows/deploy.yml`) теперь ставит Node.js,
`npm ci`, `npm run build`, и деплоит `dist/` на GitHub Pages.
