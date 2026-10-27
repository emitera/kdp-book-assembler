---
name: seo-and-geo-optimization
description: Complete engineering playbook for Technical SEO, Core Web Vitals optimization, Open Graph / social cards, JSON-LD Schema.org rich snippets, dynamic sitemaps, robots.txt, and GEO (Generative Engine Optimization) for AI search engines (Perplexity, ChatGPT Search, Gemini, Google AI Overviews).
---

# Technical SEO & Generative Engine Optimization (GEO) Playbook

This skill provides practical, copy-pasteable architectural patterns to ensure web applications and landing pages achieve high organic rankings in Google Search and authoritative citations in AI-powered search engines.

---

## 1. Why AI-Generated Web Apps Fail in Search Engines

1. **Client-Side Rendering (CSR) Trap**: Pure React/Vite SPAs render empty HTML shells (`<div id="root"></div>`), forcing search engine bots to execute heavy JavaScript. If bots timeout or defer JS parsing, the page is indexed as blank.
   - *Fix*: Always use **Next.js App Router** with Server Components (RSC) and Server-Side Rendering (SSR) or Static Site Generation (SSG) for all public-facing pages.
2. **Missing Heading Architecture**: Using generic styled `<div>` or multiple competing `<h1>` tags confuses crawler understanding.
   - *Fix*: Exactly one `<h1>` per page. Heading hierarchy MUST nest logically (`<h1>` -> `<h2>` -> `<h3>`).
3. **No Machine-Readable Entities**: Without Schema.org JSON-LD, search bots cannot distinguish between an article, an online course, a product price, or an FAQ.
   - *Fix*: Embed structured JSON-LD scripts with verified Schema.org types.

---

## 2. Next.js App Router Metadata Standard

In Next.js 14/15, define type-safe metadata using the native `Metadata` API in `page.tsx` or `layout.tsx`:

```typescript
// app/[locale]/courses/[slug]/page.tsx
import { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse(params.slug);

  return {
    title: `${course.title} | CodeCraft Academy`,
    description: course.shortDescription, // 150-160 characters
    alternates: {
      canonical: `https://codecraft.academy/courses/${course.slug}`,
      languages: {
        'en-US': `https://codecraft.academy/en/courses/${course.slug}`,
        'ru-RU': `https://codecraft.academy/ru/courses/${course.slug}`,
      },
    },
    openGraph: {
      title: `${course.title} — Intensive Online Course`,
      description: course.shortDescription,
      url: `https://codecraft.academy/courses/${course.slug}`,
      siteName: 'CodeCraft Academy',
      images: [
        {
          url: `https://codecraft.academy/og/${course.slug}.png`,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.shortDescription,
      images: [`https://codecraft.academy/og/${course.slug}.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

---

## 3. JSON-LD Schema.org Entity Patterns

Embed structured data using `<script type="application/ld+json">` inside Server Components.

### 3.1. Online School Course Schema (`Course`)
```typescript
export function CourseJsonLd({ course }: { course: CourseData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'CodeCraft Academy',
      sameAs: 'https://codecraft.academy',
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      instructor: {
        '@type': 'Person',
        name: course.instructorName,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 3.2. FAQ Page Schema (`FAQPage`)
Captures prominent expandable accordion rich snippets directly in Google SERP:
```typescript
export function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 4. Dynamic Sitemaps & Robots.txt

In Next.js, implement code-generated sitemaps and robots directly in the `app/` folder:

### `app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://codecraft.academy';
  const courses = await getAllCourseSlugs();

  const courseUrls = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...courseUrls,
  ];
}
```

### `app/robots.ts`
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/private/'],
      },
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://codecraft.academy/sitemap.xml',
  };
}
```

---

## 5. Generative Engine Optimization (GEO) for AI Search Engines

To be cited as the definitive answer by **Perplexity, SearchGPT, Gemini, and Google AI Overviews**, apply these structural patterns:

1. **Direct Answer Paragraphs**: Place a concise, high-value 40–50 word summary directly below every primary `<h2>` answering the user question without filler.
2. **Comparison Data Tables**: AI engines parse markdown and HTML tables reliably. Whenever comparing plans, tech stacks, or features, use structured `<table>` markup.
3. **Information Gain**: Include specific metrics, benchmarks, author credentials, and date stamps. Generic AI fluff is downranked by Google's helpful content algorithms.
4. **Structured Quotations**: Use semantic `<blockquote>` tags with author attribution for expert commentary.

---

## 6. Core Web Vitals (CWV) Optimization Checklist

- [ ] **LCP (Largest Contentful Paint < 2.5s)**: Hero image uses `priority={true}` in `next/image` with WebP/AVIF format.
- [ ] **CLS (Cumulative Layout Shift < 0.1)**: All images and video containers have explicit aspect ratio or `width`/`height`. Fonts use `next/font` (preloaded, swap).
- [ ] **INP (Interaction to Next Paint < 200ms)**: Defer non-critical JavaScript using dynamic imports (`next/dynamic`) or `requestIdleCallback`.
