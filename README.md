# 📚 Birdy Pages (KDP Book Assembler)

> **Zero-Crop Amazon KDP Book Formatting & Automated Print PDF Assembler**  
> *Production Web Application & Native Desktop Client (Cloudflare Workers + Supabase + React 19 + Paddle MoR)*

[![Backend Status](https://img.shields.io/badge/API-Cloudflare%20Workers-orange)](https://kdp-backend.emitera.workers.dev)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind-blue)](https://birdypages.io)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-green)](https://supabase.com)
[![Billing](https://img.shields.io/badge/Merchant%20of%20Record-Paddle%20Billing-black)](https://paddle.com)

---

## 🎯 Overview

**Birdy Pages** is an end-to-end software platform designed for self-publishers and authors publishing paperbacks and hardcovers to Amazon KDP (Kindle Direct Publishing). It eliminates formatting errors, distorted image ratios, rejected PDF files, and complex manual spine calculations.

### Key Capabilities:
- **Zero-Crop Policy:** User illustrations and interior layouts are rendered strictly non-destructively with immutable source blobs and mathematical aspect-ratio auto-fitting.
- **KDP Mathematical Precision:** Built-in dynamic calculation for paper thickness (White B&W, Cream B&W, Standard Color, Premium Color), spine width, spine text safety gates ($N \ge 75/79$ pages), hardcover wrap ($0.591''$), and mandatory $0.125''$ cover bleeds.
- **Client-Side PDF Generation:** High-resolution 300 DPI PDF generation with embedded color profiles directly in the browser via `pdf-lib`.
- **Merchant of Record (MoR) Integration:** Fully integrated with Paddle Billing (One-time pass, Monthly Pro, Yearly Pro, Desktop Lifetime).
- **Desktop Node-Locked Licensing:** Automated generation of `BIRDY-XXXX-XXXX-XXXX` license keys, cryptographic hardware ID binding (`hardware_id`), and offline grace periods.
- **Supabase Anti-Pause Keep-Alive:** Dual-layer automated heartbeat preventing database dormancy on free/starter tiers.

---

## 🏗 Repository Structure

```
.
├── .agents/                 # Web Engineering Team Operating System & Specialized Skills
├── .github/
│   └── workflows/
│       └── supabase-keepalive.yml  # Autonomous cron keep-alive worker
├── backend/                 # Cloudflare Workers Serverless API (Hono + TypeScript)
│   ├── src/
│   │   ├── auth.ts          # Supabase Auth, Admin Verification & Paddle HMAC-SHA256
│   │   ├── billing.ts       # Paddle MoR Checkout Session orchestration
│   │   ├── db.ts            # Supabase Client Factory
│   │   └── index.ts         # Edge API Routes & Admin Authorization Middleware
│   ├── schema.sql           # Database DDL schema (profiles, licenses, tickets, settings)
│   └── wrangler.json        # Cloudflare Workers configuration
├── frontend/                # Single-Page Web Application (React 19 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/      # Dashboard, Canvas, AdminPanel, SupportPage, DocViewer
│   │   ├── context/         # AppContext (Auth, Credits, Locale, Canvas State)
│   │   ├── services/        # Supabase Client & Keep-Alive REST trigger
│   │   └── utils/           # kdpMath.js (KDP mathematical engine)
│   └── vite.config.js       # Vite configuration with rolldown code-splitting
├── docs/                    # Complete Engineering & Legal Documentation Suite
│   ├── master_index.md      # Master documentation index
│   ├── architecture.md      # System topology, database schema & AppSec model
│   ├── kdp_math.md          # KDP dimensional formulas and spine rules
│   ├── rendering_engine.md  # 3-layer DOM hierarchy & Zero-Crop standard
│   ├── desktop_bridge.md    # Flutter UI ⟷ Python Engine bridge & upscaling
│   ├── terms_desktop_draft.md    # Desktop EULA & Terms of Service
│   ├── privacy_desktop_draft.md  # Desktop Privacy Policy
│   └── refund_desktop_draft.md   # Desktop 14-Day Refund Policy
├── scripts/                 # Maintenance, migration, and automation scripts
│   ├── keepalive_schema.sql # Healthcheck table DDL
│   └── supabase-keepalive.ts# Autonomous Node.js keep-alive worker
└── README.md                # Project README (this file)
```

---

## 🔒 Security & AppSec Architecture

1. **Admin Authorization Guard:** All routes under `/api/admin/*` are strictly guarded by `verifyAdminUser` middleware in the Cloudflare Worker, verifying valid Supabase session tokens and `role === 'admin'` in `public.profiles`.
2. **Paddle Webhook HMAC Verification:** `POST /api/webhooks/paddle` cryptographically verifies the `Paddle-Signature` header using HMAC-SHA256 (`crypto.subtle`), constant-time string comparison, and a 5-minute replay attack threshold.
3. **Edge Sliding-Window Rate Limiting:** IP-based sliding window protection (`30 req/min` for desktop license validation; `5 req/10min` for support ticket submissions).
4. **Credential Protection:** Secrets like `paddle_api_key` are masked before returning to browser sessions and shielded against accidental overwrites.

---

## 🚀 Getting Started

### 1. Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Build production bundle:
```bash
npm run build
```

### 2. Backend Development (Cloudflare Workers)

```bash
cd backend
npm install
npm run dev
```

Deploy Worker:
```bash
npm run deploy
```

---

## 📖 Documentation Links

- [📚 Master Documentation Index](docs/master_index.md)
- [🏗 System Architecture & AppSec Model](docs/architecture.md)
- [📐 Core KDP Math Engine](docs/kdp_math.md)
- [🎨 UI Rendering & Zero-Crop Policy](docs/rendering_engine.md)
- [🚀 Desktop Bridge & AI Upscaling](docs/desktop_bridge.md)

---

## 📄 License & Intellectual Property

Proprietary Software. All rights reserved © Birdy Pages / Emitera.
