# 🚀 Развертывание, CI/CD и DevOps (Deployment & DevOps)

[⬅ Назад к главному оглавлению](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/master_index.md) | [Отчет по безопасности ➡](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/AUDIT_AND_SECURITY_REPORT.md)

В данном руководстве подробно описана серверная и клиентская инфраструктура проекта **Birdy Pages**, процедура автоматического деплоя через Cloudflare, настройка DNS, заголовки безопасности, маршрутизация SPA и автоматические фоновые воркеры Keep-Alive.

---

## 1. Инфраструктура хостинга (Cloudflare Pages — Frontend)

Веб-приложение собрано на **React 19 + Vite** и размещено на платформе **Cloudflare Pages**:
- Глобальная сеть доставки контента (Anycast CDN, 280+ дата-центров).
- Автоматический деплой при каждом `git push` в ветку `main` репозитория GitHub.
- Автоматическая генерация и ротация SSL/TLS-сертификатов (HTTPS / HTTP/3).
- Встроенное сжатие ассетов на лету (Gzip / Brotli).

### 1.1. Параметры проекта в панели Cloudflare Pages
- **Project Name:** `kdp-smart-assembler` (или привязанный кастомный домен).
- **Production Branch:** `main`.
- **Framework Preset:** `Vite`.
- **Build Command:** `npm run build` (в директории `frontend`).
- **Build Output Directory:** `frontend/dist`.
- **Node.js Version:** `20.x`.

### 1.2. Заголовки безопасности (`_headers`)
В `frontend/public/_headers` (автоматически попадающем в `frontend/dist/_headers` при сборке) сконфигурированы заголовки защиты:
```text
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss: blob: data:; frame-src 'self' https://checkout.paddle.com https://sandbox-checkout.paddle.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://sandbox-cdn.paddle.com; img-src 'self' https: data: blob:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:;
```
- **`X-Frame-Options: SAMEORIGIN`**: Защита от Clickjacking (запрещает встраивание сайта в сторонние фишинговые iframe).
- **`X-Content-Type-Options: nosniff`**: Блокирует MIME-sniffing браузерами.
- **`Content-Security-Policy`**: Разрешает подключение к Paddle Checkout (включая Sandbox), Supabase REST/WebSocket и CDN скриптов Paddle.

### 1.3. Маршрутизация SPA (`_redirects`)
Для предотвращения ошибки 404 Not Found при прямых переходах или перезагрузке страницы по внутренним маршрутам (`/admin`, `/support`, `/terms`, `/privacy`, `/refund`) в `frontend/public/_redirects` настроено правило:
```text
/*    /index.html   200
```

---

## 2. Серверная часть (Cloudflare Workers — Backend API)

Серверный API построен на фреймворке **Hono** и работает в бессерверной среде Cloudflare Workers (`kdp-backend.emitera.workers.dev`).

### 2.1. Конфигурация `wrangler.json`
```json
{
  "name": "kdp-backend",
  "main": "src/index.ts",
  "compatibility_date": "2024-04-03",
  "compatibility_flags": ["nodejs_compat"]
}
```

### 2.2. Обязательные переменные окружения и секреты
Управляются через CLI `wrangler secret put <KEY>` или в панели Cloudflare:
| Имя секрета | Назначение |
| :--- | :--- |
| `SUPABASE_URL` | URL инстанса Supabase (`https://<project-ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервисный ключ Supabase для административных операций |
| `JWT_SECRET` | Криптографический секрет для подписи пользовательских JWT |
| `PADDLE_API_KEY` | Секретный API-ключ Paddle Billing |
| `PADDLE_WEBHOOK_SECRET` | Секретный ключ вебхуков Paddle для HMAC-SHA256 валидации |
| `RESEND_API_KEY` | API-ключ Resend для отправки транзакционных писем |
| `SUPPORT_EMAIL` | Почта службы поддержки (`support@birdypages.io`) |

### 2.3. Команды деплоя воркера
```bash
cd backend
npm install
npm run deploy # выполняет wrangler deploy
```

---

## 3. Настройка DNS и Кастомных Доменов (`birdypages.io`)

В Cloudflare DNS настроены следующие записи:
| Тип | Имя | Значение / Цель | Proxy Status |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` (`birdypages.io`) | `kdp-smart-assembler.pages.dev` | Proxied (Включен) |
| **CNAME** | `www` (`www.birdypages.io`)| `kdp-smart-assembler.pages.dev` | Proxied (Включен) |
| **CNAME** | `api` (`api.birdypages.io`)| `kdp-backend.emitera.workers.dev` | Proxied (Включен) |

---

## 4. Фоновые воркеры и Keep-Alive (GitHub Actions)

Для предотвращения автоматической приостановки (auto-pause) базы данных Supabase на бесплатных и стартовых тарифах настроена многоуровневая система Keep-Alive.

### 4.1. GitHub Actions Cron Workflow
Файл: [`.github/workflows/supabase-keepalive.yml`](../.github/workflows/supabase-keepalive.yml)
- **Расписание:** `cron: '0 5 */2 * *'` (каждые 2 дня в 05:00 UTC).
- **Ручной триггер:** `workflow_dispatch` (возможность ручного запуска из интерфейса GitHub).
- **Скрипт выполнения:** [`scripts/supabase-keepalive.js`](../scripts/supabase-keepalive.js).

### 4.2. Алгоритм работы скрипта `supabase-keepalive.js`:
1. Выполняет REST POST-запрос с заголовком `Prefer: resolution=merge-duplicates,return=representation` к эндпоинту `public.healthcheck`.
2. Обновляет временную метку `last_ping = NOW()` для записи с `id = 'birdy_ping'`.
3. **Fallback-механизм:** Если таблица `healthcheck` недоступна, скрипт автоматически переключается на запасной запрос к таблице `desktop_licenses` (`limit=1`), гарантируя активность базы данных.
4. В браузере при открытии сайта срабатывает дополнительный фоновый вызов `pingSupabaseKeepAlive()`.
