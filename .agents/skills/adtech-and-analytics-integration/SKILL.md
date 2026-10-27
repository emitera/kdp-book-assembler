---
name: adtech-and-analytics-integration
description: Complete engineering playbook for integrating marketing, analytics, and advertising tools (Google Ads conversion tracking, Google Tag Manager, GA4 e-commerce DataLayer, Enhanced Conversions, Google Consent Mode v2, Meta Pixel, and Server-Side Conversion API).
---

# AdTech & Analytics Integration Playbook

This skill guides the implementation of advertising tracking, conversion measurement, and marketing analytics into modern web applications while preserving privacy compliance (GDPR/Consent Mode v2) and web performance (Core Web Vitals).

---

## 1. Google Tag Manager (GTM) with Performance Guardrails

Never insert heavy third-party marketing tags directly into page bundles. Use Google Tag Manager (GTM) with delayed hydration or `requestIdleCallback` so GTM does not degrade your Largest Contentful Paint (LCP).

### GTM Integration in Next.js 14/15 (`@next/third-parties`)
Google and Vercel maintain `@next/third-parties/google` for optimal, non-blocking script injection:

```bash
npm install @next/third-parties
```

```typescript
// app/layout.tsx
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';
import CookieConsentBanner from '@/components/CookieConsentBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsentBanner />
        {/* Load GTM container cleanly after hydration */}
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX'} />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXX'} />
      </body>
    </html>
  );
}
```

---

## 2. Google Consent Mode v2 (Mandatory Compliance)

In compliance with EU regulations and Google Ads requirements, tags MUST adapt their behavior based on user consent for cookies.

### 2.1. Consent Mode Default Initialization
Initialize Consent Mode to `denied` by default *before* any Google scripts execute:

```html
<!-- Injected in <head> before GTM -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // Default all advertising and analytics cookies to denied
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });
</script>
```

### 2.2. Dynamic Update upon User Cookie Banner Approval
When the user clicks "Accept All" or customizes consent in the `legal.writer`-approved banner:

```typescript
export function updateUserConsent(analyticsAllowed: boolean, adsAllowed: boolean) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: adsAllowed ? 'granted' : 'denied',
      ad_user_data: adsAllowed ? 'granted' : 'denied',
      ad_personalization: adsAllowed ? 'granted' : 'denied',
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
    });
  }
}
```

---

## 3. Google Ads Conversion Tracking & Enhanced Conversions

### 3.1. Conversion Event Dispatch
Fire conversion events upon successful checkout, lead generation form submit, or trial registration:

```typescript
// utils/analytics.ts
export function trackGoogleAdsConversion(conversionSendTo: string, value?: number, currency = 'USD') {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionSendTo, // e.g., 'AW-123456789/AbCdEfGhIjK'
      value: value || 1.0,
      currency: currency,
    });
  }
}
```

### 3.2. Enhanced Conversions (SHA-256 User Data)
Google Ads Enhanced Conversions securely hash user email and phone number with SHA-256 before transmitting, enabling Google to match conversions even if cookies are blocked:

```typescript
import crypto from 'crypto';

export function hashForEnhancedConversions(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// Client-side dispatch with hashed user parameters:
export function sendEnhancedConversion(email: string, phone: string, value: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_data', {
      email: hashForEnhancedConversions(email),
      phone_number: hashForEnhancedConversions(phone),
    });
    window.gtag('event', 'conversion', {
      send_to: 'AW-123456789/ConversionLabel',
      value: value,
      currency: 'USD',
    });
  }
}
```

---

## 4. GA4 E-commerce & Lead DataLayer Events

Standardize event naming according to the official Google Analytics 4 schema:

```typescript
// Course purchase / SaaS subscription event
export function trackPurchase(transactionId: string, value: number, items: any[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: value,
      currency: 'USD',
      items: items.map((item, idx) => ({
        item_id: item.id,
        item_name: item.title,
        price: item.price,
        index: idx,
        quantity: 1,
      })),
    },
  });
}
```

---

## 5. Meta Pixel & Server-Side Conversion API (CAPI) Deduplication

To combat browser ad-blockers and Safari ITP (Intelligent Tracking Prevention), combine client-side Meta Pixel with server-side Conversion API using a shared `event_id`:

```typescript
// 1. Generate unique event_id on action (e.g., UUID)
const eventId = crypto.randomUUID();

// 2. Fire client-side Meta Pixel with eventID:
if (window.fbq) {
  window.fbq('track', 'Purchase', { value: 99.0, currency: 'USD' }, { eventID: eventId });
}

// 3. Fire server-side CAPI request from backend service:
await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId, // Identical event_id ensures Meta deduplicates!
        user_data: {
          em: [hashForEnhancedConversions(userEmail)],
        },
        custom_data: {
          value: 99.0,
          currency: 'USD',
        },
      },
    ],
    access_token: process.env.META_CAPI_TOKEN,
  }),
});
```

---

## 6. Offline CRM Conversion Webhook to Google Ads API

When a customer deal is closed in CRM (e.g. by sales managers), your backend can relay this revenue event back to Google Ads via the Google Ads REST API:
- Stores `gclid` (Google Click Identifier) captured from the landing page URL query parameter during form submission.
- When lead status changes to "Won" in CRM, `backend.agent` fires an offline conversion upload to Google Ads with `gclid`, `conversion_date_time`, and `conversion_value`.
- This enables Google Ads Smart Bidding (Target ROAS) to optimize ads for actual closed business revenue rather than superficial cheap clicks.
