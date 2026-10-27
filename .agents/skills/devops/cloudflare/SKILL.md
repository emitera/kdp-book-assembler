---
name: devops/cloudflare
description: Enterprise deployment, edge caching, CDN acceleration, DNS, WAF security, and Turnstile bot protection on the Cloudflare Developer Platform (Pages, Workers, R2, Turnstile, Next.js OpenNext).
---

# Cloudflare Edge Deployment & Performance Playbook

This skill guides the DevOps Engineer in deploying web applications, configuring global edge CDN caching, managing custom domains and SSL, and protecting forms with Cloudflare Turnstile.

---

## 1. Next.js on Cloudflare Pages / Workers (via OpenNext)

To deploy Next.js App Router applications to Cloudflare's global edge network:

### 1.1. Installation & Tooling
```bash
npm install --save-dev @opennextjs/cloudflare wrangler
```

### 1.2. Configuration (`wrangler.jsonc`)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-web-platform",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "kv_namespaces": [
    {
      "binding": "NEXT_CACHE_WORKERS_KV",
      "id": "YOUR_KV_NAMESPACE_ID"
    }
  ]
}
```

### 1.3. Build & Deploy Commands
```bash
# Build the optimized edge bundle
npx @opennextjs/cloudflare

# Deploy to Cloudflare network
npx wrangler deploy
```

---

## 2. Cloudflare CDN, Edge Caching & Headers

Maximize cache hit ratios while ensuring instantaneous invalidation of updated assets:

### 2.1. Immutable Static Assets
Static JavaScript, CSS, and hashed image chunks should be cached aggressively at the edge and browser:
```http
Cache-Control: public, max-age=31536000, immutable
```

### 2.2. Dynamic ISR & SSR Pages
For pages that update periodically, use `stale-while-revalidate`:
```http
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

### 2.3. SSL/TLS Encryption Mode
Always configure Cloudflare SSL/TLS to **Full (Strict)**:
- Requires a valid certificate on the origin server.
- Prevents Man-in-the-Middle (MitM) attacks between Cloudflare and your origin server.

---

## 3. Cloudflare Turnstile Bot Protection (Anti-Abuse)

Cloudflare Turnstile replaces annoying reCAPTCHA puzzles with frictionless, privacy-first bot detection.

### 3.1. Client-Side Widget (Next.js / React)
```typescript
// components/TurnstileWidget.tsx
'use client';
import { useEffect, useRef } from 'react';

export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Callback window hook
    (window as any).onTurnstileSuccess = (token: string) => {
      onVerify(token);
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [onVerify]);

  return (
    <div
      ref={containerRef}
      className="cf-turnstile"
      data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY}
      data-callback="onTurnstileSuccess"
    />
  );
}
```

### 3.2. Server-Side Token Validation (API Route)
```typescript
// app/api/verify-turnstile/route.ts
export async function POST(req: Request) {
  const { token } = await req.json();

  const formData = new URLSearchParams();
  formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!);
  formData.append('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();
  if (!outcome.success) {
    return Response.json({ error: 'Turnstile bot challenge failed' }, { status: 403 });
  }

  return Response.json({ success: true });
}
```

---

## 4. Cloudflare R2 Object Storage (Zero-Egress S3-Compatible)

For user uploads (course videos, avatars, invoice PDFs), use **Cloudflare R2** with zero data transfer (egress) fees:
- Configure AWS SDK v3 with your Cloudflare Account ID endpoint (`https://<account_id>.r2.cloudflarestorage.com`).
- Issue pre-signed URLs directly to clients for secure, scalable direct-to-cloud uploads.
