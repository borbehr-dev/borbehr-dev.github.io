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
| `npm run build` | Очищает `dist/` и собирает production-версию |
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

Основной хостинг — **Cloudflare Pages**, настройки уже заданы в панели:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20`
- Переменные окружения не нужны

Резервный вариант — **GitHub Pages** через `.github/workflows/deploy.yml`
(`npm ci` → `npm run build` → публикация `dist/`). Менять workflow не требуется.

Локальная команда, повторяющая CI:

```bash
npm ci && npm run build
```

## Частые проблемы

| Симптом | Решение |
| --- | --- |
| `EADDRINUSE` на 4321 | `npx @11ty/eleventy --serve --port=8080` |
| `EADDRINUSE` на 4173 | `$env:PORT=5000; npm run preview` |
| `preview` отдаёт старое | Сначала `npm run build`, затем `npm run preview` |
| Пустой `dist/` | Запустить `npm run build` (он сам очищает `dist/`) |
| MP3 не играет локально | Проверить, что файл лежит в `public/audio/`, и пересобрать |
| Шрифты не подхватились | Проверить `dist/assets/fonts/*.woff2` после сборки |
| `npm ci` падает | Node должен быть 20+; lock-файл не удалять |
