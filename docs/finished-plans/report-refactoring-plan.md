# WebHealth Report Refactor Plan

## Context
The report pipeline and viewer work but have accumulated technical debt and capability gaps. The deterministic layer computes significant analytical value (lost clicks, cannibalization, near-win keywords) that is never surfaced in the UI. The report page is a 470-line monolithic server component with inlined helpers, missing several aiReport sections entirely, and using a legacy `quickWins` field alongside the modern `aiReport` structure. New computations (content decay, site-specific CTR benchmarks, statistical significance) would make the deterministic layer genuinely actionable without increasing AI cost. This plan keeps each phase independently deployable and backward-compatible.

---

## Executive Assessment

### What's Good
- **Pipeline separation**: deterministic → prompt → AI → merge → store is clean and correct
- **Fallback/retry**: 3-pass payload trimming, strategy fallback (json_schema ↔ tool_strict), deterministic-only fallback
- **Zod schemas**: serve as both OpenAI response_format and frontend types — single source of truth
- **Queue system**: lease heartbeats, per-team concurrency, exponential backoff — production-grade
- **Site change tracker**: SHA256 fingerprinting + diff summaries is well-designed
- **Cost guardrails**: per-report cost cap with model downgrade before token reduction

### What Needs Work
- **Monolithic page**: `apps/web/src/app/reports/[id]/page.tsx` is 470 lines, all helpers inlined, difficult to maintain
- **Missing UI sections**: `executiveSummary`, `nearWinKeywordRows`, `cannibalizationRows`, `contentAuditRows`, `siteChanges` are computed but **never rendered**
- **Dual data sources**: page reads both `report.data` (raw GSC/GA4) AND `aiReport` — top queries come from raw, quick wins from legacy `report.quickWins`, opportunities from aiReport — inconsistent
- **No charts library**: `MiniTrendChart` is inline SVG; no recharts or similar installed
- **No table library**: all tables are raw `<table>` HTML with no sorting/pagination
- **Hardcoded CTR benchmarks**: global lookup table, not site-specific
- **No content decay detection**: no rolling 28d vs historical peak comparison
- **No statistical significance**: winner/loser status is raw click delta with no z-test
- **Sparse test coverage**: 0 tests for `deterministic-insights.ts`, 0 for report page rendering, no integration tests

---

## Phase 0 — Characterization Tests

**Goal**: Lock existing behavior before any changes. Tests must pass throughout all subsequent phases.

**Complexity**: Low

**Files to create**:
- `packages/shared/src/lib/reports/deterministic-insights.test.ts`
- `packages/shared/src/lib/reports/prompt-builder.test.ts`
- `apps/web/src/app/reports/[id]/report-live-status.logic.test.ts` (already exists — verify coverage)

**Technical approach**:
Use existing `node:test` runner (consistent with `ai-report-schema.test.ts` and `report-job-row-shape.test.ts`).

**`deterministic-insights.test.ts` — cover these cases**:
```
buildDeterministicInsights with minimal input → returns all required keys
buildQueryOpportunities: position 5, CTR below expected → lostClicksEstimate > 0
buildQueryOpportunities: position 1, CTR at/above expected → lostClicksEstimate = 0
buildPageWinnersLosers: page in current not in compare → clicksCompare = 0
buildNearWinKeywords: position 8–20 → included; position 21 → excluded
buildCannibalization: same query on 2 pages → CannibalizationRow; 1 page → no row
opportunityScore: always in [0, 100]
clampRows: 51 inputs → 50 outputs (for 50-cap functions)
executiveSummary.headline: contains "up" or "down"
```

**`prompt-builder.test.ts`**:
```
buildPromptCacheKey is stable across identical inputs
buildAiReportPrompt output contains payload JSON
stableJson produces identical output for same object regardless of key insertion order
```

**Dependencies on prior phases**: None — pure unit tests

**Verification**:
```bash
cd packages/shared && pnpm test
# All new tests pass; existing tests still pass
```

**Risk**: None. Read-only characterization. Rollback = delete test files.

---

## Phase 1 — New Zod Schemas + Shared Types

**Goal**: Extend `aiSeoReportSchema` with new sections and enrich existing row types with `confidence`, `estimatedImpact`, and `actionDetail` fields. All new fields use `.nullable().default(null)` so existing stored reports parse without error.

**Complexity**: Medium

**Files to modify**:
- `packages/shared/src/lib/reports/types.ts`
- `packages/shared/src/lib/reports/ai-report-schema.ts`

**Files to create**:
- `packages/shared/src/lib/reports/ai-report-schema.test.ts` — extend existing tests for new fields

**New types in `types.ts`**:

```typescript
export type ContentDecayRow = {
  page: string;
  peakClicks: number;           // historical 28d peak
  recentClicks: number;         // rolling 28d clicks
  decayRatio: number;           // recentClicks / peakClicks (0–1)
  peakDate: string;             // ISO date of peak
  estimatedLostClicks: number;  // peakClicks - recentClicks
  severity: ReportSectionPriority;
  actionDetail: string | null;  // AI-filled per-row narrative
};

export type LostClickEstimateRow = {
  query: string;
  impressions: number;
  actualCtr: number;
  benchmarkCtr: number;         // site-specific benchmark for position
  positionBucket: number;       // lower bound of bucket: 1, 2, 3, 4, 6, 9, 13, 21
  estimatedLostClicks: number;
  confidence: number | null;    // 0–1 statistical confidence
  actionDetail: string | null;
};

export type CtrBenchmarkSummary = {
  siteAvgCtrByPosition: Record<string, number>; // "1" → 0.28, etc.
  positionBuckets: number[];                     // positions with enough data
  dataPoints: number;                            // total query-days used
  computedAt: string;                            // ISO date
};

export type AlertsAndFlags = {
  contentDecayDetected: boolean;
  significantLosers: string[];   // page URLs with statistically significant traffic loss
  cannibalizationCount: number;
  criticalTechnicalIssues: number;
};

export type ScoringMethodology = {
  ctrBenchmarkSource: "site-specific" | "global-fallback";
  significanceTestUsed: boolean;
  decayWindowDays: number;
  insightSchemaVersion: string;
};
```

**Enrich existing row types** (add optional fields, preserving all existing fields):
```typescript
// Add to QueryOpportunityRow:
confidence: number | null;        // z-test p-value confidence
actionDetail: string | null;      // AI per-row narrative

// Add to PageWinnerLoserRow:
isStatisticallySignificant: boolean | null;
zScore: number | null;
actionDetail: string | null;

// Add to ContentAuditRow:
estimatedImpact: number | null;   // 0–100
actionDetail: string | null;
refreshStrategy: string | null;   // AI per-row narrative

// Add to NearWinKeywordRow:
estimatedImpact: number | null;
actionDetail: string | null;
```

**Extend `aiSeoReportSchema`** with new top-level arrays/objects, all nullable-defaulted:
```typescript
contentDecayRows: z.array(contentDecayRowSchema).nullable().default(null),
lostClickEstimateRows: z.array(lostClickEstimateRowSchema).nullable().default(null),
alertsAndFlags: alertsAndFlagsSchema.nullable().default(null),
scoringMethodology: scoringMethodologySchema.nullable().default(null),
```

**Note — `CtrBenchmarkSummary` stays out of the AI schema**: It is a deterministic computation the AI never fills, so it belongs only in `DeterministicInsights`, not in `aiSeoReportSchema`. The AI receives the benchmark data as context in the prompt payload, but does not produce it as structured output. Including it in the OpenAI schema would add unnecessary tokens and nullable noise.

**Schema backward compatibility strategy**:
- All new top-level fields default to `null` → Zod parses old stored JSON without error
- All new fields on existing row types are optional (`?.`) in TypeScript and `.nullable().default(null)` in Zod → existing rows from DB parse without error
- The `buildOpenAiStrictJsonSchema()` function already handles nullable → `anyOf[type, null]` transformation, so OpenAI strict mode continues to work

**Verification**:
```bash
pnpm typecheck
cd packages/shared && pnpm test
# Existing schema tests pass; new nullable fields are in strict schema output
```

**Risk**: Low. Additive only. Rollback = revert types.ts and ai-report-schema.ts.

---

## Phase 2 — New Deterministic Computations in Worker

**Goal**: Add content decay detection, site-specific CTR benchmark curve, and statistical significance testing to `buildDeterministicInsights`. These run before the OpenAI call, produce structured rows, and are passed as context to the AI prompt.

**Complexity**: High

**Files to modify**:
- `packages/shared/src/lib/reports/deterministic-insights.ts`
- `packages/shared/src/lib/queue/report-worker.ts` — extend payload passed to prompt builder

**Files to create**:
- `packages/shared/src/lib/reports/deterministic-insights.test.ts` — add tests for new functions

**New computations**:

### 2a. Site-specific CTR Benchmark Curve

`buildCtrBenchmarkCurve(queries: QueryMetric[]): CtrBenchmarkSummary`

Algorithm:
```
Buckets (stored by lower bound): 1, 2, 3, 4, 6, 9, 13, 21
  (position ranges: 1 | 2 | 3 | 4–5 | 6–8 | 9–12 | 13–20 | 21+)

1. Assign each query to a bucket by mapping floor(position) to lower bound
2. For each bucket with ≥ 3 queries: compute weighted-avg CTR (weighted by impressions)
3. For buckets with < 3 queries: use global fallback (current expectedCtrAtPosition())
4. Return CtrBenchmarkSummary with siteAvgCtrByPosition keyed by lower bound ("1", "2", ..., "21"),
   dataPoints = total queries used, ctrBenchmarkSource
5. If totalQueries < 10: use global fallback for all buckets, set source = "global-fallback"
```

The `positionBucket` field in `LostClickEstimateRow` uses the same lower-bound keys (1, 2, 3, 4, 6, 9, 13, 21), making lookups into `siteAvgCtrByPosition` a direct key match.

This site-specific curve replaces the global curve in `buildQueryOpportunities()` — pass it in as a parameter so existing global-fallback behavior is preserved when data is insufficient.

### 2b. Content Decay Detection

`buildContentDecayRows(gscCurrentPages: PageMetric[], gscComparePages: PageMetric[]): ContentDecayRow[]`

Uses the per-page approach against the two GSC date ranges already fetched by the pipeline. No per-page time series required.

Algorithm:
```
For each page in gscCurrentPages:
  Find same page in gscComparePages by URL
  Skip if compare page not found (new page — not decay)
  Skip if compareClicks <= 50 (insufficient baseline)
  decayRatio = currentClicks / compareClicks
  If decayRatio < 0.65:
    estimatedLostClicks = compareClicks - currentClicks
    severity:
      decayRatio < 0.40 → "KRITISCH"   (ReportSectionPriority)
      decayRatio < 0.55 → "HOCH"
      decayRatio < 0.65 → "MITTEL"
    peakClicks = compareClicks  (compare period is the baseline)
    peakDate = compareRangeEnd  (passed in from job metadata)
    actionDetail = null         (filled by AI in Phase 3)

Sort by estimatedLostClicks descending, cap at 20 rows
```

Signature update: `buildDeterministicInsights` already receives `gscCompare.topPages` — pass both into `buildContentDecayRows` directly. No new data fetching needed.

### 2c. Statistical Significance for Winners/Losers

`addSignificanceToWinnerLoser(row: PageWinnerLoserRow, ...): PageWinnerLoserRow`

Two-proportion z-test on click-through rates:
```typescript
function twoProportionZTest(
  clicks1: number, impressions1: number,
  clicks2: number, impressions2: number
): { zScore: number; isSignificant: boolean; confidence: number } {
  const p1 = impressions1 > 0 ? clicks1 / impressions1 : 0;
  const p2 = impressions2 > 0 ? clicks2 / impressions2 : 0;
  const n1 = impressions1, n2 = impressions2;
  const pPool = (clicks1 + clicks2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2));
  if (se === 0) return { zScore: 0, isSignificant: false, confidence: 0 };
  const z = Math.abs((p1 - p2) / se);
  // p-value approximation: isSignificant if |z| >= 1.96 (95% CI)
  return {
    zScore: Number(z.toFixed(3)),
    isSignificant: z >= 1.96,
    confidence: Number(Math.min(1, z / 2).toFixed(3)), // simplified
  };
}
```

Apply to pageWinnerLoserRows where both current and compare impressions > 0.

### 2d. Update DeterministicInsights type and builder

Add new fields to `DeterministicInsights`:
```typescript
contentDecayRows: ContentDecayRow[];
ctrBenchmarkSummary: CtrBenchmarkSummary;
alertsAndFlags: AlertsAndFlags;
scoringMethodology: ScoringMethodology;
```

Update `buildDeterministicInsights()` to call new functions and populate new fields.

### 2e. Pass new data to prompt payload in report-worker.ts

In `report-worker.ts`, the `deterministic` variable is spread into the prompt payload at `["deterministic", ...]` paths. Add new paths to the 3-pass trimming config:
```typescript
{ path: ["deterministic", "contentDecayRows"], limit: 15 },
{ path: ["deterministic", "lostClickEstimateRows"], limit: 20 },
```

**Verification**:
```bash
pnpm typecheck
cd packages/shared && pnpm test
# Test: buildContentDecayRows returns 0 rows for stable pages
# Test: twoProportionZTest with known values matches expected z-score
# Test: site-specific CTR benchmark uses site data when n >= 10
```

**Risk**: Medium. Additive only — new fields are added to `DeterministicInsights` but the old fields are unchanged. Report-worker changes are additive (new array paths in trimmer). The only TypeScript breakage risk is if `DeterministicInsights` type is used with a spread — verify with typecheck. Rollback = revert deterministic-insights.ts and report-worker.ts additions.

---

## Phase 3 — Updated OpenAI Prompts and Structured Output

**Goal**: Update the master prompt to (a) tell the AI that deterministic data is pre-computed and verified, (b) request per-row `actionDetail` and `refreshStrategy` narratives rather than bulk text, (c) pass new computed sections as prompt context. This reduces hallucination risk because the AI works from anchored numbers rather than guessing.

**Complexity**: Medium

**Files to modify**:
- The master prompt in the database (`aiReportPromptVersions` table) — this is configured at runtime, NOT hardcoded. But the prompt-building logic needs to pass new keys.
- `packages/shared/src/lib/reports/prompt-builder.ts` — add explicit section hints to prompt structure
- `packages/shared/src/lib/queue/report-worker.ts` — include new deterministic sections in payload

**Prompt structural change** (update `buildAiReportPrompt`):
Add a `PRE-COMPUTED INSIGHTS` block immediately before `VARIABLE PAYLOAD` so the AI understands what numbers are authoritative and what its job is:

See **Appendix A** for the full system prompt template and user prompt template to insert as the new DB prompt version.

In code, `buildAiReportPrompt` gains a new `precomputedContext` string slot (between `REPORT METADATA` and `VARIABLE PAYLOAD`):
```
REPORT METADATA
{metadataJson}

PRE-COMPUTED INSIGHTS (verified — do not recalculate these numbers)
CTR benchmark source: {scoringMethodology.ctrBenchmarkSource}
Content decay pages: {alertsAndFlags.contentDecayDetected ? N : 0}
Statistically significant losers: {alertsAndFlags.significantLosers.length}
These rows are in the VARIABLE PAYLOAD under contentDecayRows, lostClickEstimateRows,
pageWinnerLoserRows (each has zScore and isStatisticallySignificant).

YOUR TASK FOR THIS REPORT:
1. Write dashboardMarkdown: ≤ 300 words, name specific pages/queries, consider multiple causes.
2. For EACH row in queryOpportunityRows: set actionDetail (1–2 sentences, name the exact query).
3. For EACH row in contentDecayRows: set actionDetail (name the exact page URL, specific tactic).
4. For EACH row in contentAuditRows: set actionDetail + refreshStrategy (concrete content update).
5. Do NOT recompute lostClicksEstimate, opportunityScore, decayRatio — use provided values exactly.
6. Never fabricate URLs or query strings not present in the payload.

VARIABLE PAYLOAD (JSON)
{payloadJson}
```

**Payload assembly in report-worker.ts** — include new computed data:
The `deterministic` object now has `contentDecayRows`, `ctrBenchmarkSummary`, `alertsAndFlags`. These are already part of `DeterministicInsights` after Phase 2 and will be included in the payload automatically via the existing spread. Verify the 3-pass trimmer limits are set for new paths.

**Schema update for OpenAI**:
Since Phase 1 added nullable new fields to the schema, `aiSeoReportJsonSchemaForOpenAI` is already updated via the `buildOpenAiStrictJsonSchema()` normalizer — no additional changes needed. The AI will receive the schema with the new nullable fields and can fill them if appropriate.

**Prompt versioning**: Create a new row in `aiReportPromptVersions` with the updated system prompt. The worker reads the active prompt version from `aiReportSettings`. This allows rollback by switching the active prompt version in the DB without code changes.

**Verification**:
```bash
pnpm typecheck
# Manual: generate a test report, inspect aiReportJson in DB
# Verify: contentDecayRows have non-null actionDetail when AI fills them
# Verify: queryOpportunityRows have non-null actionDetail
# Verify: dashboardMarkdown is ≤ 300 words
```

**Risk**: Medium. The prompt is stored in DB and versioned — rollback = update `aiReportSettings` to point to previous promptVersionId. TypeScript changes are additive.

**Token limit risk — split API calls**: If `buildOpenAiStrictJsonSchema()` produces a schema that hits the structured output token limit (the schema definition itself counts against the context budget), split into two sequential OpenAI calls: first call for `executiveSummary` + `dashboardMarkdown` only, second call for per-row `actionDetail` fields across `queryOpportunityRows`, `contentDecayRows`, `contentAuditRows`. This is not required for the initial implementation but is the correct escape hatch if the schema definition grows too large. Implement as two separate `outputStrategy` paths in `openai-orchestrator.ts` invoked sequentially within `processGenerateReportJob`.

---

## Phase 4 — Report Page Component Refactor (Progressive Disclosure)

**Goal**: Decompose the 470-line monolith into focused, independently testable section components. Implement progressive disclosure layout. Install recharts and @tanstack/react-table. Render all previously missing aiReport sections.

**Complexity**: High

**Dependencies**: Phases 1–3 (new schema fields must exist for rendering)

**Libraries to install** (in `apps/web/package.json`):
```bash
pnpm add recharts @tanstack/react-table
```

**New file structure**:
```
apps/web/src/app/reports/[id]/
├── page.tsx                        (orchestrator — server component, data fetch only)
├── report-actions.tsx              (unchanged)
├── report-live-status.tsx          (unchanged)
├── report-live-status.logic.ts     (unchanged)
├── sections/
│   ├── executive-summary.tsx       (NEW — headline + top action areas + alertsAndFlags)
│   ├── kpi-cards.tsx               (EXTRACT from page.tsx — Recharts sparklines)
│   ├── quick-wins-grid.tsx         (NEW — 4 tabs: CTR Gaps, Near-Win Keywords, Content Decay, Cannibalization)
│   ├── deep-dive-queries.tsx       (NEW — TanStack Table for queryOpportunityRows)
│   ├── deep-dive-pages.tsx         (NEW — TanStack Table for pageWinnerLoserRows + z-test badge)
│   ├── deep-dive-technical.tsx     (EXTRACT — technicalIssueRows grid)
│   ├── content-decay-section.tsx   (NEW — contentDecayRows)
│   ├── cannibalization-section.tsx (NEW — cannibalizationRows)
│   ├── near-win-keywords.tsx       (NEW — nearWinKeywordRows)
│   ├── action-backlog.tsx          (EXTRACT — actionBacklogRows with done toggle)
│   ├── site-changes-section.tsx    (NEW — siteChanges)
│   └── job-timeline.tsx            (EXTRACT — recentEvents)
```

**Progressive disclosure layout in `page.tsx`**:
```tsx
// 1. Executive Summary (always visible if report complete)
<ExecutiveSummary executiveSummary={aiReport.executiveSummary} alertsAndFlags={aiReport.alertsAndFlags} />

// 2. KPI Cards with sparklines (Recharts AreaChart, small, responsive)
<KpiCards data={data.gsc} aiReport={aiReport} />

// 3. Quick Wins — 4 tabs (tabs chosen over effort/impact quadrant matrix; quadrant
//    requires manual effort scoring per row which isn't available yet)
//
//    Tab 1 "CTR Gaps":          lostClickEstimateRows — queries where actual CTR < site benchmark
//    Tab 2 "Near-Win Keywords": nearWinKeywordRows — positions 8–20, high impressions
//    Tab 3 "Content Decay":     contentDecayRows — pages with ≥ 35% click drop vs compare
//    Tab 4 "Cannibalization":   cannibalizationRows — same query → multiple pages
<QuickWinsGrid
  ctrGaps={aiReport.lostClickEstimateRows}
  nearWinKeywords={aiReport.nearWinKeywordRows}
  contentDecay={aiReport.contentDecayRows}
  cannibalization={aiReport.cannibalizationRows}
/>

// 4. Deep Dives (collapsible sections, open by default)
<DeepDiveQueries rows={aiReport.queryOpportunityRows} />
<DeepDivePages rows={aiReport.pageWinnerLoserRows} />
<DeepDiveTechnical rows={aiReport.technicalIssueRows} />

// 5. Action Backlog (full list with area filter)
<ActionBacklog rows={aiReport.actionBacklogRows} />

// 6. Site Changes (collapsible, muted — informational)
<SiteChangesSection siteChanges={aiReport.siteChanges} />

// 7. Job Timeline (collapsible, muted — debugging)
<JobTimeline events={recentEvents} />
```

**KPI sparklines** — replace `MiniTrendChart` SVG with Recharts `AreaChart`:
```tsx
// 'use client' wrapper component
<ResponsiveContainer width="100%" height={60}>
  <AreaChart data={trendPoints}>
    <Area type="monotone" dataKey="clicks" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} dot={false} />
  </AreaChart>
</ResponsiveContainer>
```

**TanStack Table for deep-dives** — sortable, filterable, paginated:
```tsx
// QueryOpportunitiesTable — columns: query, impressions, ctr, position, lostClicksEstimate, opportunityScore, actionDetail
// sortable by opportunityScore desc by default
// filter input for query name
// pagination: 15 rows per page
```

**Statistical significance display** in `deep-dive-pages.tsx`:
```tsx
// PageWinnerLoserRow: show z-score badge
{row.isStatisticallySignificant && (
  <Badge variant="outline" className="text-xs">Significant (z={row.zScore})</Badge>
)}
```

**Preserving backward compat with old reports**: All new sections guard on `?? []` / `?? null` so reports generated before Phases 1–3 still render correctly (they just won't have the new sections populated).

**Remove legacy dual-data-source**:
- Replace `data.gsc.current.topQueries` table (raw data) with `aiReport.queryOpportunityRows` (already computed, richer)
- Remove rendering of `report.quickWins` (legacy field) — use `aiReport.actionBacklogRows` instead
- Keep `data.gsc` for KPI card numbers only (they're authoritative aggregates)

**Verification**:
```bash
pnpm typecheck
# Manual: navigate to https://webaudit-48.localcan.dev/reports/[id]
# Verify: all 7 sections render in order
# Verify: clicking a collapsible section expands it
# Verify: TanStack Table sorts by opportunityScore on load
# Verify: old reports (missing contentDecayRows) render without error
# Verify: Recharts sparklines animate on load
```

**Risk**: High (largest change). Mitigation: keep old `page.tsx` as `page.legacy.tsx` during transition, switch route once all sections pass manual review. Rollback = rename files back.

---

## Phase 5 — Integration Testing, Cleanup, and Documentation

**Goal**: Add integration tests covering the full pipeline, remove technical debt (legacy quickWins field usage, duplicate code), and document the report schema for future developers.

**Complexity**: Low–Medium

**Files to create**:
- `packages/shared/src/lib/reports/deterministic-insights.integration.test.ts` — full pipeline with realistic fixture data
- `apps/web/src/app/reports/[id]/sections/__tests__/executive-summary.test.tsx` — component snapshot tests using React Testing Library

**Files to modify**:
- `packages/shared/src/lib/reports/types.ts` — deprecate `QuickWin` type (mark as `@deprecated`)
- `apps/web/src/app/reports/[id]/page.tsx` — remove all references to `report.quickWins`
- `packages/shared/src/lib/reports/deterministic-insights.ts` — remove `expectedCtrAtPosition` global fallback when site-specific benchmark is available

**Cleanup tasks**:
1. Remove `import type { QuickWin } from "@webhealth/shared/lib/openai"` from page.tsx (legacy import)
2. Remove `const quickWins = report.quickWins` and its render block
3. Ensure `StatusBadge` and `Delta` are exported from shared `components/` or kept as local utilities (not inlined)
4. Add JSDoc to `buildDeterministicInsights` explaining input requirements and output guarantees

**Documentation**:
- Update `docs/` with a `report-schema.md` explaining each field, its source (deterministic vs AI), and backward compatibility guarantees

**Final verification**:
```bash
pnpm typecheck              # zero errors
cd packages/shared && pnpm test  # all tests pass
cd apps/web && pnpm test    # all tests pass
# Regenerate a report end-to-end via https://webaudit-48.localcan.dev
# Verify XLSX download works
# Verify report live status polling still functions during generation
```

---

## Phase Order (Recommended)

| Phase | Name | Complexity | Deploys Independently |
|-------|------|------------|----------------------|
| 0 | Characterization tests | Low | Yes — tests only |
| 1 | Zod schemas + shared types | Low–Medium | Yes — no behavior change |
| 2 | Deterministic computations | High | Yes — new fields, old fields unchanged |
| 3 | Prompt updates | Medium | Yes — prompt version rollback via DB |
| 4 | Report page refactor | High | Yes — UI change only, reads from existing DB fields |
| 5 | Integration tests + cleanup | Low–Medium | Yes |

## Critical Files Reference

| File | Phases |
|------|--------|
| `packages/shared/src/lib/reports/types.ts` | 1, 5 |
| `packages/shared/src/lib/reports/ai-report-schema.ts` | 1 |
| `packages/shared/src/lib/reports/deterministic-insights.ts` | 0, 2, 5 |
| `packages/shared/src/lib/reports/prompt-builder.ts` | 3 |
| `packages/shared/src/lib/queue/report-worker.ts` | 2, 3 |
| `apps/web/src/app/reports/[id]/page.tsx` | 4, 5 |
| `apps/web/src/app/reports/[id]/sections/*.tsx` | 4 (new) |
| `apps/web/package.json` | 4 (recharts, @tanstack/react-table) |

## Existing Functions to Reuse

- `buildDeterministicInsights()` in `deterministic-insights.ts:417` — extend, don't replace
- `expectedCtrAtPosition()` in `deterministic-insights.ts:115` — keep as global fallback
- `clampRows<T>()` in `deterministic-insights.ts:126` — reuse for new row builders
- `buildOpenAiStrictJsonSchema()` in `ai-report-schema.ts:314` — unchanged, handles new nullable fields automatically
- `safeParseAiSeoReport()` in `ai-report-schema.ts:324` — unchanged
- `buildPromptCacheKey()` in `prompt-builder.ts:28` — unchanged
- `requeueJobForRetry()` in `report-jobs.ts` — unchanged

---

## Appendix A — Full Prompt Templates (Phase 3)

These templates replace the existing master prompt in `aiReportPromptVersions`. Create a new row and update `aiReportSettings.activePromptVersionId` to activate.

### System Prompt

```
You are an expert SEO analyst producing structured, actionable reports for website owners.

RULES:
- All numerical values (impressions, clicks, CTR, positions, lostClicksEstimate, decayRatio,
  opportunityScore, zScore) in the payload are pre-computed and verified. Use them exactly as
  provided. Do not recalculate, round differently, or contradict them.
- Never fabricate URLs, query strings, or page paths. Only reference URLs and queries that
  appear verbatim in the payload.
- Consider multiple causes before attributing a traffic change to a single reason
  (algorithm update, seasonal effect, content change, technical issue, competitor).
- Name specific pages and queries in every recommendation. Generic advice ("improve your content")
  is not acceptable.
- dashboardMarkdown must be ≤ 300 words. Use markdown headers and bullet points.
- actionDetail fields must be 1–2 sentences, specific to the exact row (name the query or URL).
- refreshStrategy fields (contentAuditRows only) must name a concrete content update tactic
  (e.g., "Add an FAQ section targeting 'X', rewrite the intro to match informational intent").
- If a field cannot be meaningfully filled for a row, set it to null rather than generic text.
- Output language: {language}
```

### User Prompt (variable slot — passed as `payloadJson` block)

```
REPORT METADATA
{metadataJson}

PRE-COMPUTED INSIGHTS (verified — do not recalculate)
CTR benchmark source: {scoringMethodology.ctrBenchmarkSource}
Content decay pages detected: {contentDecayCount}
Statistically significant losers (95% CI): {significantLosersCount}
Available payload keys with pre-computed data:
  queryOpportunityRows   — sorted by opportunityScore desc, each has lostClicksEstimate + expectedCtr
  contentDecayRows       — pages with ≥ 35% click drop, each has decayRatio + estimatedLostClicks
  pageWinnerLoserRows    — each has zScore + isStatisticallySignificant
  lostClickEstimateRows  — per-query CTR gap vs site benchmark
  cannibalizationRows    — queries splitting traffic across multiple pages
  nearWinKeywordRows     — positions 8–20 with high impressions
  technicalIssueRows     — crawl issues bucketed by type + estimated click impact

YOUR TASKS:
1. dashboardMarkdown: ≤ 300 words. Name the top 3 specific pages or queries driving the period's
   story. State what changed and why (consider: algorithm, seasonal, content, technical, competitor).
2. executiveSummary.headline: one sentence, include the largest metric movement with its value.
3. executiveSummary.topActionAreas: 3 strings, each naming a specific query or page URL.
4. For EACH row in queryOpportunityRows (up to the provided limit):
   Set actionDetail: 1–2 sentences naming the exact query and what to change on the landing page.
5. For EACH row in contentDecayRows:
   Set actionDetail: 1–2 sentences naming the exact page URL and a specific recovery tactic.
6. For EACH row in contentAuditRows:
   Set actionDetail: specific audit finding for this page.
   Set refreshStrategy: concrete update tactic (FAQ addition, intent rewrite, schema markup, etc.).
7. All other structured arrays (kpiComparisonRows, nearWinKeywordRows, etc.) are pre-filled by the
   deterministic layer. Return them as provided — do not omit or reorder rows.

VARIABLE PAYLOAD (JSON)
{payloadJson}
```
