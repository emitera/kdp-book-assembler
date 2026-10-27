# Комплексный Аудит Архитектуры, Безопасности и Биллинга (Audit & Security Report)

**Дата проведения:** 27 октября 2026 г.  
**Проект:** Birdy Pages (`kdp book assembler`)  
**Роль:** Lead Web Architect (`web.architect`) & Cross-Functional Security Team  
**Статус проверки:** Завершена. Все выявленные критические и инфраструктурные дефекты устранены и задеплоены в ветку `main`.

---

## 1. Сводное резюме (Executive Summary)

Был проведен независимый, глубокий и всесторонний аудит безопасности, архитектуры, фронтенд-производительности, серверной части Cloudflare Workers (Hono API), базы данных Supabase (PostgreSQL, GoTrue Auth, RLS), интеграции платежного шлюза Paddle (Merchant of Record), механизмов лицензирования десктопного клиента и математического ядра Amazon KDP.

### Ключевые показатели аудита:
- **Всего проанализировано файлов:** 34 (TypeScript, JavaScript, SQL, JSX, YAML, JSON, Markdown).
- **Обнаружено критических уязвимостей (Critical):** 2 (Неавторизованный доступ к административным маршрутам, отсутствие HMAC-проверки вебхуков Paddle).
- **Обнаружено дефектов высокой важности (High):** 1 (Критическая ошибка математического ядра KDP: отсутствие обязательных вылетов $0.125''$ на обложках мягкого переплёта).
- **Обнаружено дефектов средней важности (Medium):** 6 (Утечка `paddle_api_key` в открытом виде, отсутствие Rate Limiting на проверке лицензий и тикетах, раздутый монолитный JS-бандл, отсутствие HTTP Security Headers в Cloudflare Pages, отсутствие SPA `_redirects`, отсутствие эндпоинта `create-user`).
- **Обнаружено дефектов низкой важности (Low):** 1 (Устаревший и фрагментированный DDL базы данных в `backend/schema.sql`).
- **Итоговый статус устранения:** 10 из 10 уязвимостей и дефектов **полностью устранены, протестированы и зафиксированы в кодовой базе**.

---

## 2. Матрица обнаруженных рисков и уязвимостей

| ID | Уязвимость / Дефект | Компонент | Уровень риска | Вектор угрозы / Последствия | Статус устранения |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Полное отсутствие авторизации на маршрутах `/api/admin/*` | `backend/src/index.ts`, `AdminPanel.jsx` | **CRITICAL** | Любой анонимный пользователь мог вызвать `/api/admin/update-user-role`, начислить себе кредиты или удалить аккаунты. | ✅ **УСТРАНЕНО** (`verifyAdminUser` middleware + `adminFetch` с Bearer JWT) |
| **SEC-02** | Отсутствие проверки HMAC-подписи Paddle Webhook | `backend/src/index.ts`, `backend/src/auth.ts` | **CRITICAL** | Возможность подделки события `transaction.completed` и бесплатного получения Pro-лицензий. | ✅ **УСТРАНЕНО** (`verifyPaddleWebhookSignature` HMAC-SHA256 с окном 5 мин) |
| **SEC-03** | Нарушение спецификации Amazon KDP для обложек (Math Engine) | `frontend/src/utils/kdpMath.js` | **HIGH** | Если `hasBleed = false`, обложка генерировалась без вылетов $0.125''$ — гарантированный отказ KDP Preflight. | ✅ **УСТРАНЕНО** (Зафиксирован безусловный вылет $0.125''$ со всех 4 сторон) |
| **SEC-04** | Утечка приватного ключа `paddle_api_key` в браузер | `backend/src/index.ts` (`/api/admin/payment-settings`) | **MEDIUM** | Возврат полного секретного ключа в DevTools администратора; риск утечки при XSS или инспекции сети. | ✅ **УСТРАНЕНО** (Автоматическое маскирование `padd_••••••••xxxx`) |
| **SEC-05** | Отсутствие Rate Limiting на публичных эндпоинтах | `backend/src/index.ts` (`validate-license`, `ticket`) | **MEDIUM** | Риск брутфорса лицензионных ключей и флуда базы тикетов поддержки. | ✅ **УСТРАНЕНО** (In-memory скользящий лимитер: 30 req/min и 5 req/10min) |
| **SEC-06** | Монолитный бандл и медленный First Contentful Paint | `frontend/src/App.jsx` | **MEDIUM** | Все 1270 строк админки и юридические документы грузились на первом экране (~1.27 МБ). | ✅ **УСТРАНЕНО** (Code-splitting: `React.lazy` + `Suspense`, экономия ~180 кБ) |
| **SEC-07** | Отсутствие HTTP Security Headers в Cloudflare Pages | `frontend/public/_headers` | **MEDIUM** | Риск атак Clickjacking (отсутствие `X-Frame-Options`), MIME-sniffing и выполнения сторонних скриптов. | ✅ **УСТРАНЕНО** (Создан файл `_headers` с CSP, HSTS, SAMEORIGIN) |
| **SEC-08** | Отсутствие SPA Rewrites (`_redirects` в Cloudflare Pages) | `frontend/public/_redirects` | **MEDIUM** | Прямой переход или перезагрузка страницы на `/admin`, `/support`, `/terms` вызывал ошибку 404. | ✅ **УСТРАНЕНО** (Создан файл `_redirects` с правилом `/* /index.html 200`) |
| **SEC-09** | Несуществующий эндпоинт `POST /api/admin/create-user` | `backend/src/index.ts`, `AdminPanel.jsx` | **MEDIUM** | Модальное окно добавления пользователя падало с ошибкой 404 Not Found. | ✅ **УСТРАНЕНО** (Реализован эндпоинт через `supabase.auth.admin.createUser`) |
| **SEC-10** | Устаревший и фрагментированный DDL базы данных | `backend/schema.sql`, migrations | **LOW** | Развертывание базы «из коробки» приводило к сломанным связям и отсутствию таблиц. | ✅ **УСТРАНЕНО** (Создан единый `supabase_schema.sql` и обновлен `backend/schema.sql`) |

---

## 3. Детальный разбор проблем и технические решения

### 3.1. [КРИТИЧЕСКИЙ] SEC-01: Эскалация прав администратора и неавторизованные вызовы CRM

#### Вектор атаки:
В `backend/src/index.ts` все маршруты управления пользователями, тарифами, лицензиями и настройками биллинга (`/api/admin/*`) не содержали никаких проверок сессии:
```bash
# Злоумышленник мог отправить POST-запрос с произвольным userId:
curl -X POST https://kdp-backend.emitera.workers.dev/api/admin/update-user-role \
  -H "Content-Type: application/json" \
  -d '{"userId": "attacker-uuid", "role": "admin"}'
```
В результате атакующий получал полный доступ к управлению всей платформой.

#### Реализованное решение:
1. В `backend/src/auth.ts` разработана функция `verifyAdminUser`:
   - Извлекает Bearer-токен из заголовка `Authorization`.
   - Проверяет валидность сессии через `supabase.auth.getUser(token)`.
   - Выполняет запрос к таблице `profiles` и проверяет `profile.role === 'admin'`.
2. В `backend/src/index.ts` зарегистрирован глобальный middleware:
   ```ts
   app.use('/api/admin/*', async (c, next) => {
     const authHeader = c.req.header('Authorization');
     const result = await verifyAdminUser(c.env, authHeader);
     if (!result.authorized) {
       return c.json({ error: result.error }, result.status as any);
     }
     await next();
   });
   ```
3. Во фронтенде (`AdminPanel.jsx`) создан хелпер `adminFetch`, который асинхронно получает токен активной сессии через `supabase.auth.getSession()` и автоматически подставляет `Authorization: Bearer <token>`.

---

### 3.2. [КРИТИЧЕСКИЙ] SEC-02: Подделка вебхуков Paddle и несанкционированная генерация лицензий

#### Вектор атаки:
Обработчик `POST /api/webhooks/paddle` парсил сырой JSON и генерировал лицензионный ключ `BIRDY-XXXX-XXXX-XXXX`, а также обновлял статус подписки на `monthly`/`yearly`/`lifetime` без проверки подписи `Paddle-Signature`.  
Любой пользователь мог отправить фиктивное событие:
```json
{
  "event_type": "transaction.completed",
  "data": {
    "customer": { "email": "freebie@hacker.com" },
    "custom_data": { "plan_type": "lifetime" }
  }
}
```
И получить бесплатную пожизненную лицензию с активацией в базе и отправкой ключа на почту.

#### Реализованное решение:
В `backend/src/auth.ts` реализована криптографическая верификация `verifyPaddleWebhookSignature`:
- Нативная криптография Web Crypto API (`crypto.subtle.importKey`, `crypto.subtle.sign('HMAC', ...)`).
- Защита от Replay-атак: проверка временной метки `ts` заголовка с допустимым окном расхождения не более 300 секунд (5 минут).
- Защита от атак по времени (timing attacks): константное сравнение строк через `timingSafeEqual`.
- Если `PADDLE_WEBHOOK_SECRET` задан, любой запрос с неверной или отсутствующей подписью немедленно отклоняется с HTTP 401.

---

### 3.3. [ВЫСОКИЙ] SEC-03: Математическая ошибка вылетов обложки Amazon KDP

#### Дефект:
В `frontend/src/utils/kdpMath.js` расчет размеров обложки мягкого переплёта выполнялся с условием:
```javascript
const width = (trimWidth * 2) + spineWidth + (hasBleed ? (BLEED_INCHES * 2) : 0);
const height = trimHeight + (hasBleed ? (BLEED_INCHES * 2) : 0);
```
Флаг `hasBleed` относился к страницам внутреннего блока книги. Если пользователь собирал книгу без вылетов страниц (например, обычный текстовый блок), то обложка рассчитывалась без обязательного вылета $0.125''$ по краям.  
При загрузке такого PDF автоматический валидатор Amazon KDP выдавал критическую ошибку несоответствия размеров и отклонял публикацию книги.

#### Реализованное решение:
Согласно стандартам KDP Cover Creator Guidelines, обложка в мягком переплёте **всегда** печатается как единый разворот и требует вылета $0.125''$ ($3.2\text{ мм}$) по всем четырем сторонам независимо от блока:
```javascript
const width = (trimWidth * 2) + spineWidth + (BLEED_INCHES * 2);
const height = trimHeight + (BLEED_INCHES * 2);
```

---

### 3.4. [СРЕДНИЙ] SEC-04 & SEC-05: Защита секретов и Rate Limiting

1. **Маскирование API-ключей:**
   - В `GET /api/admin/payment-settings` ключ маскируется (`${key.slice(0, 4)}••••••••${key.slice(-4)}`).
   - В `POST /api/admin/update-payment-settings` добавлена защита от перезаписи: если клиент присылает маску `••••`, оригинальный ключ в БД сохраняется неизменным.
2. **Лимитирование запросов (Rate Limiting):**
   - На базе скользящего окна по `cf-connecting-ip` внедрена защита:
     - `POST /api/desktop/validate-license`: не более 30 запросов в минуту на IP.
     - `POST /api/support/ticket`: не более 5 тикетов за 10 минут на IP.

---

### 3.5. [СРЕДНИЙ] SEC-06: Оптимизация FCP/LCP и Code-Splitting

- **До оптимизации:** Единый бандл `index-Dz3nzinS.js` весил **1,266.65 кБ** (407.09 кБ gzip). Все тяжелые административные компоненты и парсеры документов грузились при первом визите на главную страницу.
- **После оптимизации:** В `frontend/src/App.jsx` внедрен `React.lazy` и `<Suspense fallback={<PageFallback />}>`.
- **Результат:**
  - `dist/assets/index-DwvhKvIG.js`: **1,086.29 кБ** (экономия ~180 кБ на критическом пути).
  - `AdminPanel-BnrROMaz.js`: **37.68 кБ** (подгружается только по адресу `/admin`).
  - `DocViewer-DbHyYQNH.js`: **126.18 кБ** (подгружается только на страницах документов).
  - `SupportPage-C1S2P27r.js`: **7.69 кБ** (подгружается только на `/support`).

---

### 3.6. [СРЕДНИЙ] SEC-07 & SEC-08: Инфраструктура Cloudflare Pages (`_headers`, `_redirects`)

1. **`frontend/public/_headers`:**
   Внедрены обязательные заголовки защиты:
   ```text
   /*
     X-Frame-Options: SAMEORIGIN
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
     Permissions-Policy: camera=(), microphone=(), geolocation=()
     Content-Security-Policy: default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss: blob: data:; frame-src 'self' https://checkout.paddle.com https://sandbox-checkout.paddle.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://sandbox-cdn.paddle.com; img-src 'self' https: data: blob:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:;
   ```
2. **`frontend/public/_redirects`:**
   Внедрено правило перезаписи SPA:
   ```text
   /*    /index.html   200
   ```
   Устранена ошибка 404 при прямом переходе на внутренние маршруты.

---

## 4. Готовый Remediation SQL-скрипт для Supabase

Полный единый DDL-скрипт развернут в файлах `supabase_schema.sql` (корень проекта) и `backend/schema.sql`.

Ключевые политики защиты:
```sql
-- 1. Защита от эскалации привилегий при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, subscription_status, generation_credits)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'user', 'free', 0)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Запрет смены роли обычными пользователями
CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 3. Закрытие публичной утечки email-адресов
CREATE POLICY "Allow select profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
```

---

## 5. Дорожная карта устранения замечаний (Remediation Roadmap)

1. **Фаза 1: Неотложные исправления безопасности (Выполнено и задеплоено):**
   - [x] **SEC-01**: Защита административных маршрутов `/api/admin/*` авторизационным middleware.
   - [x] **SEC-02**: HMAC-SHA256 криптографическая верификация вебхуков Paddle.
   - [x] **SEC-03**: Исправление вылетов $0.125''$ обложек мягкого переплёта KDP.
   - [x] **SEC-04**: Маскирование секретных ключей Paddle API в админке.
   - [x] **SEC-05**: Лимитирование запросов (Rate Limiting) на валидацию лицензий и тикеты.
   - [x] **SEC-06**: Динамическое разделение кода (Code-Splitting) через `React.lazy`.
   - [x] **SEC-07 & SEC-08**: Добавление файлов `_headers` и `_redirects` для Cloudflare Pages.
   - [x] **SEC-09**: Реализация эндпоинта `POST /api/admin/create-user`.
   - [x] **SEC-10**: Формирование единого, консолидированного `supabase_schema.sql`.

2. **Фаза 2: Действия администратора в живой базе Supabase:**
   - [ ] Запустить `supabase_schema.sql` в SQL Editor Supabase для применения свежих RLS-политик и функций.
   - [ ] Проверить наличие переменной `PADDLE_WEBHOOK_SECRET` в Cloudflare Workers Environment Variables.

3. **Фаза 3: Десктопный клиент (Flutter + Python):**
   - [ ] Синхронизация логики валидации лицензий по аппаратному ID (`hardware_id`).
   - [ ] Внедрение локального AI-апскейлинга изображений (Real-ESRGAN / ONNX).
