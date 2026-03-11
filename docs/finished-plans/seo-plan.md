# WebAudit SEO Plan

**Audited:** 2026-03-09
**Site:** webhealth.devbrew.dev — SaaS SEO reporting tool
**Stack:** Next.js App Router, Vercel
**Public pages:** `/`, `/demo`, `/pricing`, `/privacy`, `/terms`

---

## Executive Summary

Technical foundations are solid (sitemap, robots.txt, metadataBase, OG tags), but one critical issue and several high-impact gaps are limiting organic reach:

1. **Homepage is fully client-rendered** — Google sees a mostly empty shell until JS executes
2. **No structured data** — missing schema for SoftwareApplication, Organization, FAQ
3. **No content strategy** — zero blog/educational content; all organic traffic must come from 5 thin pages
4. **Missing keyword-rich landing pages** — no pages targeting key SaaS/SEO tool queries
5. **Thin pricing page** — zero content beyond the component; missing comparison opportunities

---

## Critical Issues

### 1. Homepage rendered entirely as `"use client"`

`apps/web/src/app/(marketing)/page.tsx` starts with `"use client"`, making the entire homepage a client component. Google can render JS but it adds latency, crawl budget cost, and indexation delays. The H1, all feature copy, and CTAs are invisible in static HTML.

**Fix:** Convert to a Server Component. Extract only the parts that need interactivity — the `handleGoogleSignIn` button and Framer Motion animations — into small `"use client"` child components. The rest (H1, features grid, how-it-works steps) should be static HTML.

```
// page.tsx — Server Component
import { HeroCtaButton } from "./hero-cta-button";    // "use client"
import { MotionFeaturesGrid } from "./motion-features"; // "use client"
```

---

## High Impact Issues

### 2. No structured data (schema markup)

No JSON-LD anywhere. Missing:

- **`SoftwareApplication`** — enables rich results (price, category)
- **`Organization`** — establishes entity identity for Google's Knowledge Graph
- **`WebSite`** with `SearchAction` — enables sitelinks search box
- **`FAQPage`** — enables FAQ rich results for feature/pricing questions

**Fix:** Add to `apps/web/src/app/layout.tsx`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "WebAudit",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Automated SEO reporting connecting GSC + GA4 with AI-ranked fix lists."
    })
  }}
/>
```

Add `Organization` and `WebSite` schemas similarly.

### 3. No blog or content hub

All 5 public pages are product/legal pages. No blog means no organic reach beyond brand searches.

High-value content opportunities:

| Content type | Example keywords |
|---|---|
| How-to guides | "how to use google search console", "how to find seo issues" |
| Comparison pages | "google search console vs ga4", "best seo audit tools" |
| Explainers | "what is CTR in seo", "what is LCP core web vitals" |
| Feature pages | "automated seo reports", "ai seo audit tool" |

**Fix:** Add a `/blog` route and publish 2-4 articles/month targeting informational queries.

### 4. Missing feature/use-case landing pages

No pages targeting head keywords potential users search:

- `/features/google-search-console-reporting`
- `/features/ga4-analytics-reporting`
- `/use-cases/seo-reporting-for-freelancers`
- `/use-cases/automated-seo-audit`

The homepage targets everyone but ranks for no specific query. Dedicated pages with 400–800 words of focused content can rank for competitive SaaS terms.

### 5. Thin pricing page

`apps/web/src/app/(marketing)/pricing/page.tsx` is 15 lines — just a wrapper for `<PricingSection />` with a 2-line metadata block. No prose, no FAQ, no comparison table.

**Fix:** Add:
- A comparison section ("What's included in Free vs Pro")
- An FAQ section (rendered as `FAQPage` schema)
- A brief "Who is this for" paragraph targeting keywords like "seo tool for freelancers"

---

## Medium Impact Issues

### 6. Title tags not keyword-optimized

| Page | Current title | Issue |
|---|---|---|
| `/` | "WebAudit \| SEO & Analytics Monitoring" | "SEO & Analytics Monitoring" is vague |
| `/pricing` | "Pricing — WebAudit" | Misses "seo audit tool pricing" |
| `/demo` | "Demo Report — WebAudit" | Misses "free seo audit demo" |

**Suggested homepage title:** `"WebAudit — Automated SEO Reports from GSC + GA4 | Free to Start"`

### 7. Homepage H1 isn't keyword-rich

Current H1: **"GSC + GA4 data. Ranked fixes in 3 min."**

Compelling hook but contains no keywords Google can associate with user intent.

**Fix:** Keep the hook, add a keyword-containing subheading below it:
```
<h1>GSC + GA4 data. Ranked fixes in 3 min.</h1>
<p>Automated SEO audit reports that connect Google Search Console and Analytics,
   crawl your site, and surface AI-ranked fixes.</p>
```

The existing `<p>` subheading (line ~202) is close but doesn't use "SEO audit" or "automated reports."

### 8. robots.ts explicit `allow` list is redundant

`apps/web/src/app/robots.ts` specifies `allow: ["/", "/demo", "/pricing", ...]`. Everything not explicitly disallowed is allowed by default, so this is unnecessary and could confuse some crawlers.

**Fix:** Remove the `allow` array, keep only `disallow`.

### 9. Sitemap `lastModified` always returns current date

`apps/web/src/app/sitemap.ts` uses `new Date()` for all pages. Every crawl sees the site as "just modified," wasting crawl signal.

**Fix:** Use static dates for stable pages:
```ts
{ url: `${BASE_URL}/pricing`, lastModified: new Date("2026-03-01"), ... }
```

### 10. No About page or E-E-A-T signals

No `/about` page, no team bios, no company context beyond "DevBrew" in the footer. For a tool handling users' analytics data, E-E-A-T signals matter.

**Fix:** Add a minimal `/about` page with who built it, why, and company context. Link from footer.

---

## Prioritized Action Plan

### Critical (do first)
- [ ] Convert homepage to Server Component, extract client islands for auth button and animations

### High impact
- [ ] Add JSON-LD schema (SoftwareApplication + Organization + WebSite) to root layout
- [ ] Create `/blog` route and publish first 3 articles targeting informational SEO keywords
- [ ] Add 2–3 feature/use-case landing pages targeting head keywords

### Medium impact
- [ ] Revise homepage title tag to include "automated seo reports"
- [ ] Add keyword context to homepage subheading ("automated SEO audit reports")
- [ ] Expand pricing page: FAQ section, comparison table, FAQPage schema
- [ ] Add `/about` page, link from footer

### Quick wins (low effort)
- [ ] Remove redundant `allow` array from `robots.ts`
- [ ] Use static dates in `sitemap.ts` for stable pages
- [ ] Add FAQPage schema to pricing page

---

## What's Already Good

- robots.txt and sitemap correctly structured and cross-referenced
- metadataBase set, OG/Twitter cards configured with og-image
- `/demo` page is a **server component** with real metadata — indexable and best organic entry point beyond homepage
- Privacy/Terms pages exist and are linked in footer
- `lang="en"` on `<html>`
- Next.js font optimization via `next/font`
- Canonical URLs handled automatically by Next.js metadataBase
- Skip-to-content link and aria labels present
- Vercel Analytics installed
