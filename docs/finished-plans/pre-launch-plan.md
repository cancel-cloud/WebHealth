# Pre-Launch Plan — Webhealth

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[?]` needs info

---

## 🚨 Critical

### 1. Replace hardcoded `localcan.dev` URL with env var
**Files affected:**
- `apps/web/src/app/layout.tsx` — `metadataBase` + OG image URLs
- `apps/web/src/app/sitemap.ts` — `BASE_URL`
- `apps/web/src/app/robots.ts` — sitemap URL
- `apps/web/src/app/api/stripe/checkout/route.ts` — fallback origin
- `apps/web/src/app/api/stripe/portal/route.ts` — fallback origin

**Env var:** `NEXT_PUBLIC_APP_URL`
- Local dev value: `https://webaudit-79.localcan.dev` (stays as localcan tunnel, changes per dev)
- Production value: `https://webhealth.devbrew.dev` (current production domain, may change)

**Plan:**
- Add `NEXT_PUBLIC_APP_URL` to `.env.example` (frontend section)
- Update all 5 files to use `process.env.NEXT_PUBLIC_APP_URL` (with `webhealth.devbrew.dev` fallback)
- Each developer sets their own localcan URL in their local `.env.local`

**Also — `.env.example` needs a full audit and restructure:**

The file currently exists at `.env.example` (root) but is missing several env vars that are actively used,
and has no structure to distinguish where each var is needed.

Proposed structure for `.env.example`:

```
# ── SHARED (required by both web and worker) ─────────────────────────────────
DATABASE_URL
DIRECT_DATABASE_URL
DATABASE_POOL_*
OAUTH_TOKEN_ENCRYPTION_KEY
ARTIFACT_TOKEN_SECRET

# ── FRONTEND (apps/web) ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL          ← NEW (currently hardcoded)
BETTER_AUTH_URL
NEXT_PUBLIC_BETTER_AUTH_URL
BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_STATE_SECRET
STRIPE_SECRET_KEY            ← MISSING from current .env.example
STRIPE_WEBHOOK_SECRET        ← MISSING from current .env.example
STRIPE_PRO_PRICE_ID          ← MISSING from current .env.example
STRIPE_AGENCY_PRICE_ID       ← MISSING from current .env.example
WORKER_ARTIFACT_URL
OPENAI_ADMIN_KEY             ← MISSING from current .env.example
OPENAI_ORG                   ← MISSING from current .env.example
OPENAI_PROJECT               ← MISSING from current .env.example

# ── WORKER (apps/worker) ─────────────────────────────────────────────────────
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_BASE_URL
OPENAI_MAX_INPUT_TOKENS      ← MISSING from current .env.example
OPENAI_MAX_TOKENS            ← MISSING from current .env.example
REPORT_WORKER_*
REPORT_AI_COST_CAP_USD
REPORT_ARTIFACTS_DIR
REPORT_OPENAI_POLL_*
WORKER_HTTP_PORT
WORKER_ARTIFACT_URL
```

**Decisions:**
- [x] `NEXT_PUBLIC_APP_URL` confirmed as env var name
- [x] Stripe price IDs added to `.env.example` (placeholders — real values already in deployed envs)
- [x] `OPENAI_ADMIN_KEY` — **remove entirely** (see item 1a below)
- [x] `OPENAI_ORG` / `OPENAI_PROJECT` — optional, add to `.env.example` with comment: "recommended for per-project cost tracking in OpenAI dashboard"

---

### 1a. Remove `OPENAI_ADMIN_KEY` and cost reconciliation feature
**Used only for:** Pulling daily billing data from OpenAI's org-level cost API (admin-only, not core product).

**Files to delete:**
- `packages/shared/src/lib/openai/cost-reconciler.ts`
- `apps/worker/src/reconcile-openai-costs.ts`
- `scripts/reconcile-openai-costs.ts`

**Files to edit:**
- `apps/web/src/app/(app)/admin/ai-report-debug/debug-console.tsx` — remove "Daily billed spend (reconciled)" section

**Safe to remove:** Yes — fully self-contained, admin-only, no effect on report pipeline.

---

### 2. Create `/og-image.png` ✅
**Done.** Generated via `scripts/generate-og-image.mjs` using a screenshot of the demo page.
- Output: `apps/web/public/og-image.png` (1200×630px)
- Script kept for regeneration if the demo UI changes: `node scripts/generate-og-image.mjs <screenshot.png>`

---

## 🔴 High

### 3. Add product screenshot to homepage hero ✅
**Done.** Centered floating card with glow, hover scale + label, links to /demo.
- Image: `apps/web/public/hero-screenshot.png` (1601×712 — demo report screenshot)
- `next/image` with `priority` (LCP element), explicit dimensions, meaningful alt text
- `focus-visible:ring` on wrapping link, hover overlay with "View sample report →" hint
- Glow halo is `aria-hidden`
- Regenerate image: drop new screenshot at `apps/web/public/hero-screenshot.png`

---

### 4. Hide Notifications tab until email system is built
**Decision:** Defer. No email provider set up, no user demand confirmed yet.
- Hide the Notifications tab in Settings — do not delete any of the existing toggle code
- "Email support" on Pro pricing card stays — it refers to contact@devbrew.dev (real, available now)
- Revisit after launch once users ask for it

**File to edit:**
- `apps/web/src/app/(settings)/settings/page.tsx` — conditionally hide the Notifications tab (e.g. remove the tab trigger and panel, keep the underlying code)

---

### 5. Remove "View Devices" button
**Decision:** Delete it entirely — no code worth keeping here.

**File to edit:**
- `apps/web/src/app/(settings)/settings/page.tsx` — remove the Security Options section (the `handleViewDevices` function, the section heading, and the button)

---

### 6. First-run onboarding modal
**Context:** `AutoSync` (`dashboard/auto-sync.tsx`) already fires on first login when `hasProperties === false` — it silently POSTs to `/api/properties/sync` and shows a toast. The modal will take over this UX entirely.

**Behaviour:**
- Shows **immediately** on first login (before sync completes), triggered by `hasProperties === false` + localStorage flag `webhealth_welcomed` not set
- The modal owns the sync: fires `/api/properties/sync` itself, shows a live spinner that updates to "X properties synced" on success
- Once sync resolves, reveals the 3-step rundown (don't auto-close — user dismisses)
- On dismiss: set `localStorage.setItem("webhealth_welcomed", "1")` so it never shows again
- `AutoSync` component should be disabled/removed once modal handles this

**Modal content:**
1. **Header** — Webhealth logo + name, one-liner: "GSC + GA4 data. Ranked fixes in 3 minutes."
2. **Live sync row** — spinner → "Syncing your Google properties…" → "✓ X properties synced" (or error state)
3. **3-step rundown:**
   - **Properties** — Go to Properties, link any GSC and GA4 properties together
   - **Reports** — Go to Reports, create a new report for any property
   - **Sidebar** — Bottom-left has your Settings, Theme toggle, and report/detail usage counters
4. **CTA button** — "Go to Properties →" (links to `/properties`, closes modal)

**Files to create/edit:**
- `apps/web/src/app/(app)/dashboard/onboarding-modal.tsx` — new client component
- `apps/web/src/app/(app)/dashboard/page.tsx` — render `<OnboardingModal hasProperties={hasProperties} />`, remove `<AutoSync>`
- `apps/web/src/app/(app)/dashboard/auto-sync.tsx` — delete (logic moves into modal)

---

### 7. Fix community link in Settings
**Decision:** Replace placeholder `#` with GitHub Discussions.

**File to edit:**
- `apps/web/src/app/(settings)/settings/page.tsx` — replace the Discord/community `href="#"` with `https://github.com/cancel-cloud/WebHealth/discussions`
- Update the label from "Discord" → "GitHub Discussions" if it isn't already

---

## 🟡 Medium

### 8. Rework Agency pricing card to "coming soon" teaser
**Decision:** Strip price, strip feature list. Make it an interest-sparker for high-volume clients.

**Marketing page** (`apps/web/src/app/(marketing)/page.tsx`) — Agency card in `PLANS` array:
- Remove `price` / `period`
- Remove all feature bullet points
- Replace with a short teaser headline + 1–2 lines of copy aimed at agencies/high-volume users
- Rename CTA from "Contact Us" → something like "Get early access" or "Let's talk"
- CTA `href` → `mailto:contact@devbrew.dev?subject=Webhealth Agency Interest`
- Add a "Coming Soon" badge to the card header

**Settings page** (`apps/web/src/app/(settings)/settings/page.tsx`) — Agency card in plan selector:
- Replace price + feature list with the same teaser treatment
- Replace "Upgrade to Agency" button → "Get in touch" button as `<a href="mailto:contact@devbrew.dev?subject=Webhealth Agency Interest">`
- Keep current-plan state intact if user somehow has agency tier already

---

### 9. Add standalone `/pricing` page
**Decision:** Proper page (not redirect) for SEO — canonical URL, own metadata, independently indexable.

**Plan:**
- Extract the pricing section from `(marketing)/page.tsx` into a shared `<PricingSection />` component
- Create `apps/web/src/app/(marketing)/pricing/page.tsx` with its own metadata:
  - `title: "Pricing — Webhealth"`
  - `description: "Simple, transparent pricing. Free to start — no credit card required."`
- Render `<PricingSection />` on both `/` (homepage) and `/pricing`
- Add `/pricing` to `sitemap.ts` (priority 0.7, changeFrequency: "monthly")
- Add `/pricing` to `robots.ts` allow list

---

### 10. Report sharing — post-launch, tease in UI now
**Decision:** Build after launch. Add a disabled "Share report" button to the report detail page with a "Coming soon" tooltip — makes it visible and creates anticipation.

**Pre-launch (now):**
- Add a `Share` button (disabled) to `apps/web/src/app/reports/[id]/page.tsx` header area
- Tooltip on hover: "Share a public link with clients — coming soon"

**Post-launch (later):**
- Signed token generation, public `/r/[token]` route, no-auth report view

---

### 11. `/admin` root — no action needed ✅
Intentional Next.js route structure — admin section uses sub-pages only. Not a bug.

---

### 12. Clean up outdated TODO comment
**File:** `apps/web/src/app/(settings)/settings/page.tsx` line 506
**Problem:** `TODO[delete-account]: No real deletion yet` — but the API is real and working.

**Plan:** Remove the comment.

---

### 13. Rename "AI Expansions" → "Deep Dives" + add `?` tooltip
**Decision:** Rename everywhere user-facing + add a small inline `?` icon with a one-liner fact/recommendation.

**Tooltip copy (short, factual):** *"Expand any report section for a deeper AI analysis. Use them on your highest-traffic pages first."*

**DB / migration files — do NOT touch** (renaming `report_detail_ai_expansions` table or `detailsPerMonth` column requires a migration with zero user-facing value).

**Files to update (UI labels only):**
- `apps/web/src/components/usage-card.tsx` — rename label "AI Expansions" → "Deep Dives", add `?` icon (same line height as text) with tooltip
- `apps/web/src/app/reports/[id]/sections/get-details-button.tsx` — toast copy "Monthly AI expansion limit reached" → "Monthly Deep Dive limit reached"
- `packages/shared/src/lib/queue/report-worker.ts` — internal log "detail expansion audit row" → "deep dive audit row" (optional, minor)
- Any admin views that display "AI Expansions" as a label to the operator

---

## 🟢 Nice to have

### 14. Wire up keyboard shortcuts
**Problem:** Keyboard shortcuts shown in Settings sidebar are hardcoded display only — not functional.

### 15. Add `/pricing` standalone page for SEO

### 16. `metadataBase` from env var
Already covered in item 1 — same env var fixes this.
