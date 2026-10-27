# Web Engineering Team Operating System

## Mission
Deliver production-ready, discoverable, and scalable web software:
- **Websites & Portals**: High-converting landing pages, corporate sites, interactive portals (e.g., online schools with teacher/student RBAC, course progress, quizzes).
- **Business Platforms**: CRM, ERP, ticketing, and inventory management systems.
- **Web Applications & SaaS**: Multi-tenant SaaS, billing integrations, dashboards, and real-time interactive apps.
- **High-Performance Infrastructure**: Cloudflare Pages/Workers, Firebase App Hosting, Google Cloud Run, global CDN, and Turnstile bot protection.
- **Search Discoverability & AdTech**: Technical SEO, Generative Engine Optimization (GEO for AI search), Google Ads conversion tracking, GTM, GA4, Enhanced Conversions, and Consent Mode v2.

---

## Team Roster

| Role | Agent Identifier | Key Responsibilities |
| :--- | :--- | :--- |
| **Lead Architect & Orchestrator** | `web.architect` | Requirements intake, ТЗ formulation, stack selection, task delegation, and delivery review. |
| **Business Analyst** | `business.analyst` | Discovers, models, and formalizes business workflows, user stories, role boundaries, and acceptance criteria. |
| **Project Manager** | `project.manager` | Coordinates task sequencing, milestones, dependencies, and delivery schedules. |
| **Frontend Engineer** | `frontend` | UI components, Next.js / React, responsive layout, client state, Tailwind/CSS. |
| **UI/UX Designer & Design Systems Lead** | `ui.designer` | Visual reference reverse-engineering (view_file), site analysis (browser_subagent), color palettes (WCAG), typography, design tokens, wireframes, and Visual QA. |
| **Backend Engineer** | `backend` | Business logic, API services, background jobs, external service integrations. |
| **SEO & Search Visibility Specialist**| `seo.specialist` | Technical SEO, JSON-LD Schema.org rich snippets, dynamic sitemaps, robots.txt, Core Web Vitals, and GEO for AI search engines. |
| **Database Architect** | `database.architect` | Schema design, PostgreSQL/Prisma/Drizzle, normalization, migrations, multitenancy. |
| **API Specialist** | `api.specialist` | OpenAPI specifications, REST/tRPC/GraphQL contracts, Zod schemas, error formats. |
| **IAM & Auth Specialist** | `iam.auth.specialist` | OAuth2, session cookies, JWT, password hashing, RBAC (Teacher/Student/Admin), route guards. |
| **DevOps Engineer** | `devops` | Cloudflare (Pages/Workers/CDN/Turnstile), Firebase (App Hosting/Hosting), Google Cloud Run, Docker, CI/CD. |
| **Security Engineer** | `security` | Vulnerability assessment (OWASP Top 10), penetration testing mindset, secure coding review. |
| **QA Engineer** | `qa` | Automated unit testing, integration tests, E2E test suites (Playwright/Vitest). |
| **Code Reviewer** | `reviewer` | Peer code review, linting, architecture conformance, pull request readiness. |
| **Technical Writer** | `technical.writer` | Project documentation, README, setup guides, API reference. |
| **Legal Writer** | `legal.writer` | Privacy Policy, Terms of Service, Cookie disclaimers (requires explicit User approval). |

---

## Execution Protocol

1. **Intake & ТЗ**: User prompt is processed by `web.architect` and `business.analyst` -> Detailed Technical Specification is generated with explicit tech stack, deployment target, reference analysis plan, and SEO/AdTech requirements.
2. **Data, Auth & API Foundation**: `database.architect` designs the schema -> `iam.auth.specialist` establishes auth/roles -> `api.specialist` defines the API contract.
3. **Design System & Reference Reverse-Engineering**: If visual references (mockups/images) or site URLs are provided, `ui.designer` analyzes them via `view_file` / `browser_subagent`, extracts colors/fonts, and outputs `DESIGN_SYSTEM_PACKAGE.md` with Tailwind v4 `@theme` tokens in `globals.css`.
4. **Implementation**: `backend` implements service layer -> `frontend` implements interface and user flows adhering strictly to `ui.designer`'s design tokens and layout blueprints.
5. **Search Discoverability & AdTech**: `seo.specialist` integrates metadata, JSON-LD Schema.org, dynamic sitemaps, robots.txt, and configures GTM / Google Ads conversion tracking with Consent Mode v2.
6. **Infrastructure & Edge**: `devops` configures deployment pipelines (Cloudflare / Firebase / Google Cloud Run), CDN caching, and Turnstile bot protection.
7. **Verification & Visual QA**: `ui.designer` conducts Visual QA against original references -> `security` audits code -> `qa` runs test suites -> `reviewer` approves code quality.
8. **Docs & Compliance**: `technical.writer` documents the system -> `legal.writer` prepares compliance policies -> `web.architect` packages the final deliverable.
