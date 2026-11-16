# Команды проекта

Все команды выполняются из корня репозитория. Стек и структура описаны в
[`README.md`](./README.md).

## Требования

- Node.js **20** или новее (`node -v`)
- npm 10+ (`npm -v`)
- Windows PowerShell, macOS или Linux — команды одинаковые

## Быстрый старт

```bash
npm install      # установка зависимостей
npm run dev      # dev-сервер с live reload
```

Сайт: `http://localhost:4321`.

## npm-скрипты

| Команда | Что делает |
| --- | --- |
| `npm install` | Устанавливает зависимости из `package.json` |
| `npm ci` | Чистая установка строго по `package-lock.json` (как в CI) |
| `npm run dev` | Dev-сервер Eleventy с live reload на `http://localhost:4321` |
| `npm start` | То же, что `npm run dev` |
| `npm run build` | Очищает `dist/` и собирает production-версию, затем проверяет полноту `dist/` |
| `npm run verify` | Проверяет, что `dist/` полный: страницы, CSS, JS, шрифты, иконки, ссылки |
| `npm run preview` | Локальный сервер для собранного `dist/` на `http://127.0.0.1:4173` |
| `npm run clean` | Удаляет каталог `dist/` |
| `npm run assets:generate` | Пересоздаёт favicon PNG и `og.png` из `public/favicon.svg` |

## Разработка

```bash
npm run dev
```

- Порт по умолчанию — `4321`.
- Другой порт — напрямую через Eleventy:

  ```bash
  npx @11ty/eleventy --serve --port=8080
  ```

- Сборка без сервера, но с отслеживанием изменений:

  ```bash
  npx @11ty/eleventy --watch
  ```

- Обычная сборка без очистки `dist/`:

  ```bash
  npx @11ty/eleventy
  ```

## Сборка и проверка результата

```bash
npm run build     # production-сборка в dist/
npm run preview   # http://127.0.0.1:4173
```

Проверка конкретных URL (PowerShell):

```powershell
Invoke-WebRequest http://127.0.0.1:4173/ -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest http://127.0.0.1:4173/audio/ -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest http://127.0.0.1:4173/projects/ -UseBasicParsing | Select-Object StatusCode
```

С preview-сервером можно сменить порт и хост:

```powershell
$env:PORT=5000; npm run preview          # PowerShell
$env:HOST="0.0.0.0"; npm run preview     # доступ из локальной сети
```

```bash
PORT=5000 npm run preview                # macOS / Linux
```

Остановить dev/preview-сервер — `Ctrl+C`.

## Тест с телефона по локальной сети

Компьютер и телефон должны быть в одной сети (один роутер/Wi-Fi; гостевые сети
и AP isolation не подойдут).

1. Узнать IP компьютера:

   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 |
     Where-Object { $_.IPAddress -notlike '127.*' } |
     Select-Object IPAddress, InterfaceAlias
   ```

2. Запустить сервер и открыть на телефоне `http://<IP>:<порт>`.

**Вариант A — dev-сервер с live reload:**

```bash
npm run dev
```

Dev-сервер слушает все интерфейсы. Пример: `http://192.168.1.50:4321`.

**Вариант B — preview production-сборки** (ближе к реальному сайту):

```powershell
npm run build
$env:HOST="0.0.0.0"; npm run preview
```

Пример: `http://192.168.1.50:4173`. По умолчанию preview слушает только
`127.0.0.1`, поэтому нужен `HOST`.

3. Если телефон не подключается — разрешить Node.js в брандмауэре Windows
   (PowerShell от администратора):

   ```powershell
   New-NetFirewallRule -DisplayName "borBeHR LAN" -Direction Inbound `
     -Protocol TCP -LocalPort 4321,4173 -Action Allow -Profile Private
   ```

   Удалить правило, когда оно больше не нужно:

   ```powershell
   Remove-NetFirewallRule -DisplayName "borBeHR LAN"
   ```

Проверить доступность с самого компьютера:

```powershell
Invoke-WebRequest "http://<IP>:4173/" -UseBasicParsing | Select-Object StatusCode
```

## Ассеты

```bash
npm run assets:generate
```

Создаёт из `public/favicon.svg`:

- `public/favicon-32.png`
- `public/favicon-192.png`
- `public/apple-touch-icon.png`
- `public/og.png` (1200×630)

Для обычной сборки команда не нужна — готовые файлы уже лежат в `public/`.

## Контент

### Добавить трек

```powershell
Copy-Item "C:\path\to\track.mp3" public\audio\
npm run build
```

```bash
cp ~/Music/track.mp3 public/audio/
npm run build
```

Длительность и slug считаются автоматически, название берётся из имени файла.
Красивое название, обложку и избранное можно задать в `src/lib/tracks.js`
(`TRACK_META`, `FEATURED`).

### Алерты и контакты

Правятся в `config.yaml` → `site`, `alerts`. После изменения:

```bash
npm run build
```

### Проекты

- Автоматически: `projects: []` в `config.yaml` → данные GitHub на этапе сборки.
- Вручную: заполнить `projects:` в `config.yaml`.
- После изменения — `npm run build`.

## Чистая переустановка зависимостей

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json   # только если нужно обновить lock
npm install
npm run build
```

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

Обычная чистая установка без удаления lock-файла:

```bash
npm ci
npm run build
```

## Дополнительные проверки (опционально)

Эти инструменты не входят в зависимости проекта — запускаются через `npx`.

```bash
npm audit --audit-level=low                  # уязвимости зависимостей
npx -y csstree-validator src/assets/css/global.css   # синтаксис CSS
node --check src/assets/js/site.js           # синтаксис JS
node --check src/assets/js/audio.js
node --check src/assets/js/projects.js
npx -y html-validate@9 "dist/index.html"     # HTML (стилистические правила могут шуметь)
```

Проверка, что в сборке не осталось неотрендеренных шаблонов:

```bash
npm run build
node -e "const fs=require('fs');const s=fs.readFileSync('dist/index.html','utf8');console.log(/{{|{%/.test(s)?'TEMPLATES LEFT':'OK')"
```

## Деплой

Основной хостинг — **Cloudflare Pages**. Он публикует **закоммиченный `dist/`**,
поэтому каталог не должен быть в `.gitignore` (сейчас не в нём).

Обычный цикл публикации:

```bash
npm run build          # сборка + проверка полноты dist/
git add dist           # именно dist — чтобы попали и новые файлы
git status             # проверить, что /assets, /about, robots.txt в индексе
git commit -m "build: обновление сайта"
git push
```

Проверка, что критичные файлы попали в git:

```bash
git ls-files dist | Select-String "assets/css/global.css|about/index.html|robots.txt"
```

Должно быть три строки. Без git — `npm run verify`.

После пуша Cloudflare пересобирает сайт сам. Если старые файлы остались в
кеше: Cloudflare Dashboard → Caching → Purge Everything.

Настройки проекта в панели:

- Build command: пусто (деплоится готовый `dist/`)
- Build output directory: `dist`
- Node.js version: `20`
- Переменные окружения не нужны

Если задать Build command `npm run build`, Cloudflare начнёт собирать сайт сам и
коммитить `dist/` станет не обязательно.

Резервный вариант — **GitHub Pages** через `.github/workflows/deploy.yml`
(`npm ci` → `npm run build` → публикация `dist/`). Менять workflow не требуется.

Локальная команда, повторяющая CI:

```bash
npm ci && npm run build
```

## Если на телефоне сайт выглядит сломанным

CSS и JS подключаются с версией (`/assets/css/global.css?v=<hash>`), поэтому
после деплоя браузер сам берёт свежие файлы. Но если телефон успел сохранить
старый ответ (например, когда сайт был собран неполностью), кеш нужно сбросить
один раз вручную.

**Быстрая проверка:** открыть сайт в приватном/инкогнито-окне. Если там всё
в порядке — виноват кеш обычного окна.

**Chrome на Android:**

1. ⋮ → История → Удалить данные просмотров → «Изображения и файлы в кеше».
2. Либо точечно: ⋮ → Настройки → Настройки сайтов → Все сайты →
   `borbehr.eu.org` → «Удалить и сбросить».

**Safari на iPhone:** Настройки → Safari → Дополнения → Данные сайтов →
найти `borbehr.eu.org` → удалить (или Настройки → Safari → «Очистить историю
и данные»).

**Встроенный браузер (Telegram/Instagram/VK):** очистить кеш приложения или
открыть страницу в системном браузере.

Для ноутбука/десктопа: `Ctrl+Shift+R` (Windows) или `Cmd+Shift+R` (macOS).

## Частые проблемы

| Симптом | Решение |
| --- | --- |
| На сайте нет стилей, в консоли `MIME type text/html` для `/assets/...` | В деплой попал неполный `dist/`: `dist/` был в `.gitignore`. Собрать, затем `git add dist` и запушить; после деплоя очистить кеш |
| На телефоне «голый» текст, на ноуте всё ок | Старый ответ в кеше телефона. Проверить в инкогнито и сбросить данные сайта — см. раздел «Если на телефоне сайт выглядит сломанным» |
| `EADDRINUSE` на 4321 | `npx @11ty/eleventy --serve --port=8080` |
| `EADDRINUSE` на 4173 | `$env:PORT=5000; npm run preview` |
| `preview` отдаёт старое | Сначала `npm run build`, затем `npm run preview` |
| Пустой `dist/` | Запустить `npm run build` (он сам очищает `dist/`) |
| `build` падает на `verify-dist` | В `dist/` нет файлов из списка — смотреть строки `✗` в выводе |
| MP3 не играет локально | Проверить, что файл лежит в `public/audio/`, и пересобрать |
| Шрифты не подхватились | Проверить `dist/assets/fonts/*.woff2` после сборки |
| `npm ci` падает | Node должен быть 20+; lock-файл не удалять |
