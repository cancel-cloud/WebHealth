# Landing And Launch Gaps

Date: 2026-05-01

This file tracks product and code gaps that should be closed before selling the current agency landing promise as a paid product. It intentionally focuses on things that are missing, misleading, too shallow, or disconnected from the product surface.

## What Is Already Real

- Google Search Console and GA4 property discovery exist.
- Active properties can enqueue source-data refresh jobs and crawl refresh jobs.
- The live property dashboard reads cached GSC/GA4 facts, latest crawl data, and deterministic insights.
- Snapshot exports and public share links exist.
- Basic team branding exists for shared reports.
- Admin pages exist for users, sync jobs, feedback, logs, feature flags, billing settings, product analytics, and debug views.

The main issue is that the product is currently closer to a deterministic live dashboard than an AI analysis product. The landing page says this carefully in some places, but several surfaces still imply more than the backend actually delivers.

## P0 - Must Fix Before A Paid Launch

### 1. No real AI analysis pipeline exists for the client value proposition

Evidence:
- `packages/shared/src/lib/live-dashboard.ts:1189` calls `buildDeterministicInsights(...)` directly.
- `packages/shared/src/lib/live-dashboard.ts:1218` takes `insights.weeklyActionRows`, slices them, and stores them as actions.
- `packages/shared/src/lib/deterministic-insights.ts:524` ranks actions with fixed score rules.
- `packages/shared/src/lib/deterministic-insights.ts:555`, `:627`, `:666`, `:704`, and `:743` generate template-based recommendations.
- `rg OpenAI` shows OpenAI code is currently limited to billing/cost helper files and admin billing display, not report generation.

Current impact:
- A paying client expecting AI analysis of GA4 + GSC + crawl content would receive deterministic templates.
- The app can say "deterministic ranked fix list"; it cannot honestly say AI has analyzed the website and produced bespoke recommendations.

Implementation needed:
- Add a worker-owned AI analysis stage after source refresh + crawl refresh.
- Build structured input from GSC facts, GSC raw query/page payloads, GA4 summaries/profile data, crawl pages, page text excerpts, and change history.
- Add a schema for AI output: executive summary, ranked actions, evidence, assumptions, risks, and client-safe explanation.
- Persist AI outputs separately from deterministic evidence so the UI can show what came from rules vs. model reasoning.
- Add cost caps, retry behavior, model selection, and admin visibility before enabling it for paid plans.

### 2. The "AI Insights" navigation item is effectively a dead surface

Evidence:
- `apps/web/src/components/app-shell.logic.ts:137` adds an `AI Insights` sidebar item linking to `/dashboard?view=ai-insights`.
- `apps/web/src/app/(app)/dashboard/page.tsx:15` does not read `searchParams` or render a separate AI insights view.

Current impact:
- Users can click a primary app nav item that only changes the URL query string.
- This makes the app look unfinished and weakens trust in the "AI" positioning.

Implementation needed:
- Either remove the nav item until real AI insights exist, or add a real page/view.
- If kept, it should show actual model-generated analysis, cost state, latest run state, and fallback deterministic evidence.

### 3. GA4 data is fetched too shallowly for the promised analysis

Evidence:
- `packages/shared/src/lib/google/api.ts:343` only fetches daily `sessions`, `totalUsers`, and `newUsers` for the production metrics cache path.
- `packages/shared/src/lib/metrics-cache.ts:521` uses only `fetchGa4DailySummary(...)`.
- `packages/shared/src/lib/live-dashboard.ts:1192` passes only GA4 aggregate totals into deterministic insights and hardcodes `newUsers: 0`.
- A richer GA4 profile function exists at `packages/shared/src/lib/google/api.ts:383`, but it is not wired into `metrics-cache` or `live-dashboard`.

Current impact:
- The app cannot make strong business recommendations from landing pages, traffic source shifts, events, conversion proxies, devices, or acquisition channels.
- GA4 is mostly displayed as sessions/users next to GSC, not used as deep analysis input.

Implementation needed:
- Decide the GA4 dimensions that matter for the paid offer: landing page, source/medium, default channel group, device, country, key events/conversions, revenue where available.
- Store those in cache tables or window-level artifacts.
- Feed them into both deterministic evidence and AI analysis.
- Update the UI to surface GA4-driven actions separately from pure SEO/crawl actions.

### 4. The crawler is too basic to justify "technical audit" expectations

Evidence:
- `packages/shared/src/lib/crawl.ts:340` crawls pages and extracts title, meta description, H1 count/text, canonical URL, visible text excerpt, and internal links.
- `packages/shared/src/lib/crawl.ts:391` only creates issues for missing title, missing meta description, missing H1, and multiple H1.
- `packages/shared/src/lib/deterministic-insights.ts:431` buckets only those crawl issues into technical action rows.

Current impact:
- The crawl is useful, but it is not a launch-grade technical SEO audit.
- Current marketing examples mention things like slow LCP, schema, hreflang, sitemap, image alt text, and 404 cleanup, but the crawler does not detect most of that.

Implementation needed:
- Add checks for HTTP status chains, canonical mismatch, noindex, robots directives, sitemap presence, hreflang, image alt text, internal 4xx/5xx links, duplicate titles/descriptions, thin content, structured data, viewport/mobile basics, and performance data if available.
- Record issue severity and exact affected elements.
- Feed crawl text and technical findings into the AI analysis stage.

### 5. Pricing, billing, and entitlement models do not match the public plans

Evidence:
- `apps/web/src/lib/pricing.ts:54` exposes public landing tiers `Solo`, `Starter`, `Studio`, and `Agency`.
- `apps/web/src/lib/pricing.ts:18` still keeps an older in-app `Solo`, `Pro`, `Agency` model.
- `apps/web/src/app/api/stripe/checkout/route.ts:16` accepts only `"pro"` and `"agency"`.
- `packages/shared/src/db/plan-settings-defaults.ts:4` seeds only `free`, `pro`, and `agency`.

Current impact:
- Starter and Studio are sellable on the landing page but not actually purchasable or enforceable as first-class tiers.
- Agency overage pricing (`+EUR 6/site`) is copy-only and not mapped to Stripe or entitlements.

Implementation needed:
- Choose one plan model and remove the other.
- Add Stripe prices/products for Starter, Studio, and Agency, or change marketing back to Free/Pro/Agency.
- Implement per-plan limits for active/reportable client sites, snapshots, team seats, branding, support, and agency controls.
- Add tests around checkout plan validation, webhook tier mapping, and plan label display.

### 6. Agency white-label and delivery promises are still mostly roadmap

Evidence:
- `apps/web/src/lib/pricing.ts:109`, `:114`, `:138`, and `:141` mark custom domain, Looker export, per-client access controls, and SSO as preview/planned.
- `apps/web/src/app/(marketing)/agency-homepage.content.ts:685`, `:696`, and `:707` mark white-label delivery and scheduled sends as preview/planned.
- The product has a branding settings page and public share links, but no PDF export, scheduled email delivery, custom domain, client portal permissions, or SSO.

Current impact:
- The product can show a branded share report, but it cannot yet deliver the full agency workflow the page sells.

Implementation needed:
- Define the minimum paid agency deliverable: branded public link only, PDF, email delivery, or client portal.
- Ship that path end-to-end before removing preview labels.
- Keep "custom domain", "scheduled send", "Looker export", "per-client access controls", and "SSO" visibly planned until implemented.

### 7. `product-analytics.png` and related screenshots are not plugged in

Evidence:
- Root files exist: `product-analytics.png`, `product-analytics-final.png`, and `product-analytics-final-wait.png`.
- `rg product-analytics` only finds the admin route/component names, not image imports or public asset references.
- `apps/web/public` contains `hero-screenshot.png` and `og-image.png`, but not these product analytics screenshots.

Current impact:
- The screenshots are orphaned artifacts. They are not used by marketing, docs, admin UI, or OG generation.
- The screenshots also show an older Product Analytics concept with App report AI/App detail AI metrics that the current page does not render.

Implementation needed:
- Decide whether these images are references, marketing assets, or stale debug screenshots.
- If they are assets, move the chosen final image into `apps/web/public` and wire it to the correct page.
- If they are stale, delete them or archive them outside the repo before launch.

## P1 - Should Fix Before Launch Or Keep Clearly Disclaimed

### 8. Product analytics instrumentation is incomplete and some admin metrics are misleading

Evidence:
- `packages/shared/src/lib/product-events.ts:1` declares `snapshot_opened` and `snapshot_share_created`.
- `apps/web/src/app/api/properties/[id]/share/route.ts:24` creates a share link but does not record `snapshot_share_created`.
- `apps/web/src/app/share/property/[token]/page.tsx:116` reads a share report but does not record `snapshot_opened`.
- `apps/web/src/app/(app)/admin/product-analytics/page.tsx:115` counts those events as "Opens", even though most are never inserted.

Current impact:
- Admin product analytics will under-report or mislabel real usage.
- This makes it hard to evaluate beta usage and paid launch readiness.

Implementation needed:
- Record share creation and share opens.
- Add events for property dashboard open, refresh started, refresh completed, action state changes, snapshot copied, billing CTA click, and Google reconnect flow.
- Separate internal admin/test activity from customer activity.

### 9. GSC-to-GA4 auto-linking is naive and can mislink client properties

Evidence:
- `packages/shared/src/lib/sync-properties.ts:145` auto-links by comparing the GSC domain string to the GA4 display name.
- `apps/web/src/app/api/properties/[id]/link-ga4/route.ts:42` verifies only that the selected GA4 property exists on the same team, not that it really belongs to the same site.

Current impact:
- Agency accounts often contain many properties with similar names. A wrong auto-link would poison analysis and client reports.

Implementation needed:
- Prefer a manual review UI after sync.
- Use GA4 data stream URL/domain if available.
- Store link confidence and whether the link was manual or automatic.
- Show a warning when GA4 and GSC hosts do not confidently match.

### 10. Multi-team and client permissions are not ready for agency accounts

Evidence:
- `apps/web/src/lib/server/authz.ts:65` returns the first membership as the primary team.
- `apps/web/src/lib/server/authz.ts:67` explicitly notes the one-effective-team assumption.
- `apps/web/src/app/(app)/dashboard/page.tsx:38` also uses `userTeams[0].teamId`.

Current impact:
- This is acceptable for a single workspace beta, but not for agency/client access controls.
- It blocks real per-client permissions, team switching, and multi-workspace ownership.

Implementation needed:
- Add selected workspace/team routing or context.
- Resolve authorization against the target resource's team, not just the first membership.
- Add tests for cross-team property/action/snapshot access.

### 11. The current action queue is capped and can hide important findings

Evidence:
- `packages/shared/src/lib/deterministic-insights.ts:781` builds candidates from fixed slices: four technical, three content decay, three CTR, three near-win, two cannibalization.
- `packages/shared/src/lib/deterministic-insights.ts:796` clamps the ranked list to eight.
- `packages/shared/src/lib/live-dashboard.ts:1218` slices visible actions again to six.

Current impact:
- Good for a calm dashboard, but risky for paid audit claims because relevant issues can disappear without explanation.

Implementation needed:
- Keep the top action list short, but store the full candidate/evidence set.
- Add "not shown because" reasons and filters.
- Let AI summarize clusters while preserving deterministic evidence.

### 12. Source-data failures are swallowed too quietly during refresh

Evidence:
- `apps/web/src/app/api/properties/[id]/rerun-all/route.ts:34` catches metrics refresh failures and still enqueues crawl and decision refresh jobs.
- The response can report partial success, but the UI path needs to make that impossible to miss before a user shares a report.

Current impact:
- A user can refresh, receive a new deterministic/crawl action set, and miss that GA4/GSC refresh failed.

Implementation needed:
- Block share/export when latest source refresh failed for the selected window, or require explicit acknowledgement.
- Include source freshness and failure state in shared reports.
- Add retry and reconnect CTAs from the dashboard.

## P2 - Cleanup Before A Public Launch

### 13. Marketing and pricing page copy still mixes old and new positioning

Evidence:
- `apps/web/src/app/(marketing)/pricing/page.tsx` metadata still says Solo, Pro, and Agency.
- Public pricing cards use Solo, Starter, Studio, Agency.
- Legal copy still references "paid plans including Pro" in some places.

Implementation needed:
- Run a copy pass across landing, pricing, settings, legal, checkout text, email/support copy, and admin labels.
- Keep preview/planned labels where the feature is not implemented.

### 14. The homepage is mostly hand-built demo UI rather than real product proof

Evidence:
- `apps/web/src/app/(marketing)/agency-homepage.content.ts` contains hardcoded portfolio/client/demo data.
- The page disclaims this as marketing preview data, which is good, but the most visual proof is still fake.

Implementation needed:
- Add one real anonymized screenshot/video/GIF of the working dashboard.
- Use actual product screenshots from `apps/web/public`, not orphaned root PNG files.
- Keep fake demo data explicitly labeled until replaced.

### 15. Admin OpenAI billing exists before app-attributed AI cost tracking

Evidence:
- `apps/web/src/app/(app)/admin/product-analytics/page.tsx:51` reads imported OpenAI daily costs.
- There is no current report-detail AI or app-attributed AI ledger wired into report generation.

Implementation needed:
- When AI analysis ships, record per-run model, tokens, cost estimate, OpenAI request id, team, property, and feature.
- Reconcile actual billing to app-attributed spend.
- Show cost per customer/report so paid pricing is defensible.

## Suggested Implementation Order

1. Rename or remove AI claims until the AI pipeline exists.
2. Ship AI analysis as a worker stage with persisted structured outputs and cost guardrails.
3. Upgrade GA4 and crawl inputs so the AI has meaningful evidence.
4. Align plans, Stripe prices, entitlements, settings, pricing page, and legal copy.
5. Finish the minimum agency delivery path: branded public link, PDF, or scheduled email.
6. Fix product analytics events and use them during beta.
7. Clean up or wire screenshots/assets.

