---
name: admin-dashboard-tailadmin
description: Production-ready Next.js 16, React 19, and Tailwind CSS v4 Admin Dashboard template playbook. Use when the project requires an Admin Panel, Back-Office, CRM, SaaS management console, Analytics dashboard, or complex data tables with dark mode, charts, and internationalization (next-intl).
---

# TailAdmin Next.js Admin Dashboard Playbook

This skill guides the **Web Architect** and **Frontend Developer** in utilizing the pre-tested, high-performance **TailAdmin** template (`web/templates/tailadmin-admin-dashboard`) for admin panels, back-offices, and SaaS management dashboards.

---

## 1. When to Use This Template

Evaluate and recommend this template when user requirements include:
- **Admin Dashboards & Back-Offices**: User management, analytics graphs, role permissions, moderation queues, order processing.
- **SaaS Management Consoles**: Multi-tenant settings, billing overviews, system telemetry, audit logs.
- **CRM & ERP Portals**: Lead pipelines, customer profiles, task trackers, data tables with pagination and search.
- **Analytics & Reporting**: Interactive charts (ApexCharts), revenue metrics, eCommerce statistics, responsive KPIs.

---

## 2. Location & Bootstrapping

The template source code is located at:
```text
ai-teams/web/templates/tailadmin-admin-dashboard/
```

### 2.1. Option A: Full Project Bootstrap (Greenfield Admin Portal)
When starting a dedicated admin dashboard project from scratch:
```bash
# 1. Create target project folder
mkdir -p ~/Projects/my-admin-portal
cd ~/Projects/my-admin-portal

# 2. Copy the template files (excluding node_modules if needed)
rsync -av --exclude 'node_modules' --exclude '.next' ~/ai-teams/web/templates/tailadmin-admin-dashboard/ ./

# 3. Copy the web team agents
cp -r ~/ai-teams/web/.agents ./

# 4. Install dependencies and start development
npm install
npm run dev
```

### 2.2. Option B: Component & Layout Extraction (Adding Admin to Existing App)
If the project already exists, extract only the required primitives from the template:
- **Shell Layout**: `src/layout/AppSidebar.tsx`, `src/layout/AppHeader.tsx`, `src/layout/Backdrop.tsx`
- **Contexts**: `src/context/SidebarContext.tsx`, `src/context/ThemeContext.tsx`
- **Tailwind v4 Theme**: Copy `@theme` color tokens and utilities from `src/app/globals.css`
- **UI Primitives**: Buttons, Modals, Badges, Dropdowns from `src/components/ui/`
- **Form Elements**: Custom inputs, MultiSelect, DropZone, DatePicker from `src/components/form/`
- **Data Tables**: `src/components/tables/BasicTableOne.tsx`, `Pagination.tsx`
- **Charts**: `src/components/ecommerce/MonthlySalesChart.tsx`, `StatisticsChart.tsx`

---

## 3. Tech Stack & Architectural Conventions

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (Strict mode).
- **Tailwind CSS v4**: Theme is declared via `@theme` in `src/app/globals.css`. **No `tailwind.config.js` exists**.
- **Internationalization (`next-intl v4`)**:
  - All routing uses `[locale]` (e.g. `/en`, `/de`, `/ar`).
  - Always import navigation primitives (`Link`, `useRouter`, `usePathname`, `redirect`) from `@/i18n/navigation`, never directly from `next/navigation`.
  - Translations live in `src/messages/<locale>.json`.
- **RTL Support**: Built-in support for Arabic (`ar`) with full CSS logical properties:
  - Margins: `ms-*` / `me-*` (not `ml-*` / `mr-*`)
  - Padding: `ps-*` / `pe-*` (not `pl-*` / `pr-*`)
  - Insets: `start-*` / `end-*` (not `left-*` / `right-*`)
  - Borders: `border-s-*` / `border-e-*`
- **Dark Mode**: Class-based dark mode (`dark:`) controlled by `ThemeContext`. Every styled component MUST support dark mode tokens.

---

## 4. Route Organization

```text
src/app/[locale]/
├── (admin)/                  # Authenticated dashboard shell (Sidebar + Header)
│   ├── (home)/               # Dashboard overview, analytics, sales metrics
│   ├── (others-pages)/       # Feature pages: calendar, profile, tables, forms
│   └── (ui-elements)/        # Reusable component showroom
├── (full-width-pages)/       # Minimal layout without sidebar/header
│   └── (auth)/signin, signup # Login, registration, password recovery
└── layout.tsx                # Root layout with NextIntlClientProvider and ThemeProvider
```

---

## 5. Integrating Business Logic & Backend

When connecting the template to your production stack:

### 5.1. Authentication (IAM)
- Replace mock auth in `src/components/auth/SignInForm.tsx` and `SignUpForm.tsx` with **NextAuth.js v5**, **Better-Auth**, or **Supabase Auth**.
- Enforce route protection via Next.js Middleware in `proxy.ts`.

### 5.2. Database & Server Actions
- Replace mock table arrays with typed queries from **Prisma** or **Drizzle**.
- Fetch table data inside Server Components, or use React Query / SWR for real-time polling.

### 5.3. Charts (ApexCharts)
`ApexCharts` is a browser-only library. Always import it dynamically with SSR disabled:
```tsx
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});
```

---

## 6. Security Checklist for TailAdmin Deployments

- [x] **Next.js Version**: Ensure `next` is updated to `>=16.4.2` to eliminate known ImageResponse and cache poisoning CVEs.
- [x] **Input Sanitization**: Ensure rich text and Markdown viewers sanitize content with DOMPurify.
- [x] **Social & Video Links**: Replace demo YouTube links and social placeholders (`PimjoHQ`) with real project endpoints or remove them.
- [x] **API Route Protection**: Verify that all admin mutations check server-side RBAC session tokens (never rely solely on client-side sidebar hiding).
