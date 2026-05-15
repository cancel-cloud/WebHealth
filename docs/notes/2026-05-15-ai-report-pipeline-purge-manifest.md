# Purge Manifest — Phase A Inventory

## STATUS: STOP. Audit-was-wrong condition hit.

Per task spec: "If `pnpm typecheck` reveals that something in the 'STAYS' list actually imported the dead modules, STOP and report — that means the audit was wrong." I caught this at grep-time, before any deletes.

## Audit violations (STAYS list imports DEAD list)

### 1. `packages/shared/src/lib/live-dashboard.ts` (STAYS) → DEAD
- Line 31: `import { getLatestCompleteAiActions } from "@webhealth/shared/lib/ai-dashboard-actions";`
- Line 1313–1338: Calls `getLatestCompleteAiActions(...)` and *merges its results into `payload.actions`* — this is the only path that surfaces AI-source actions onto the workspace action board. Deleting the pipeline removes the data source that feeds these rows.

### 2. `packages/shared/src/lib/ai-dashboard-actions.ts` (STAYS) → DEAD
This file is in the "STAYS" list, but it is **entirely** a reader of dead pipeline output:
- Imports `aiAnalysisRuns`, `aiRecommendations` from schema (both flagged for drop).
- Imports `buildAiActionIdentity`, `AiRecommendation` type from `./ai-analysis` (DEAD).
- Queries `aiAnalysisRuns` for `status = "complete"`, then loads matching `aiRecommendations` rows.
- The whole module is dead-code-equivalent the moment the runner stops producing rows.

If `ai-analysis.ts` is deleted as planned, `ai-dashboard-actions.ts` will not compile.

## Other importers of DEAD modules / tables outside the user's "STAYS but rewire" list

| File | Imports | Disposition needed |
|---|---|---|
| `apps/web/src/app/(app)/dashboard/page.tsx` (line 9, 64–65) | `getAiRunCenterData`, `AiRunCenterData` from `ai-run-center` (DEAD); also renders `<AiRunCenterView>` defined later in the same file for `?view=ai-insights` | The whole "AI Insights" view in the user dashboard is a UI for the dead pipeline. Not mentioned in user's keep list. Needs a decision: delete the route branch or replace it. |
| `apps/web/src/app/api/admin/ai-prompts/route.ts` + `route.logic.ts` | `aiAnalysisRuns`, `aiPromptTemplates`, `ai-analysis`, `ai-runtime-settings` | Reads latest pipeline runs + edits prompt templates + runtime settings. Pure dead-pipeline admin surface. |
| `apps/web/src/app/(app)/admin/ai-prompts/page.tsx` + `prompts-editor.tsx` | Calls the API above | Admin UI for editing the dead pipeline's prompts. Not the "ai-report-debug" page user mentioned keeping. |
| `apps/worker/src/main.ts` (lines 23–97) | Loads `property-refresh-worker` (which calls `runAiAnalysisForPropertyWindow`) | Worker boot path still triggers AI runs. |
| `packages/shared/src/lib/property-refresh-worker.ts` (line 15, 136) | `runAiAnalysisForPropertyWindow` from `ai-analysis-runner` | This file is on the constraint list ("do NOT touch... property-refresh-policy" — but `property-refresh-worker.ts` is different from `property-refresh-policy.ts`). Still, deletion here requires removing the AI step from the worker flow. Needs a decision. |

## "STAYS but may need rewiring" — actual disposition

User listed:
- `apps/web/src/app/(app)/admin/ai-report-debug/` (page + `debug-console.tsx`)
- `apps/web/src/app/api/admin/ai-reports/debug/route.{ts,logic.ts,logic.test.ts}`

I read both. **Good news:** neither references any DEAD module or DEAD table. The page is purely a job/cost dashboard reading `metricsBackfillJobs`, `propertyRefreshJobs`, `openaiDailyCosts`. **No rewire needed.** Disposition: leave untouched.

(Note: user said "ai-report-debug" — there is no second admin debug page elsewhere reading dead tables. The admin surface that DOES read dead tables is `admin/ai-prompts`, not `admin/ai-report-debug`.)

## Drizzle FK chain (verified in `packages/shared/src/db/schema.ts`)

Tables and FKs relevant to the pipeline:
- `ai_runtime_settings` (line 557) — singleton settings, no FK dependents.
- `ai_prompt_templates` (line 542) — versioned prompts, no FK dependents from outside the pipeline. (NOT explicitly in user's drop list — needs confirmation.)
- `ai_analysis_runs` (line 567) — FKs OUT to `teams`, `properties`, `property_refresh_jobs` (`set null`). Drop target.
- `ai_recommendations` (line 608) — FK to `ai_analysis_runs` (cascade) AND to `action_items` (`set null`). The "child near line 612" the user referenced. Drop target.

No other table FKs into `ai_analysis_runs` or `ai_recommendations`. So the drop set is:
1. `ai_recommendations` (drop first — depends on `ai_analysis_runs`)
2. `ai_analysis_runs`
3. `ai_runtime_settings`
4. **Open question:** `ai_prompt_templates` — only used by the dead runner + admin/ai-prompts surface. Probably should drop, but not in user's explicit list.

## DEAD files confirmed present
- `packages/shared/src/lib/ai-analysis.ts`
- `packages/shared/src/lib/ai-analysis.test.ts`
- `packages/shared/src/lib/ai-analysis-runner.ts`
- `packages/shared/src/lib/ai-analysis-runner-policy.test.ts`
- `packages/shared/src/lib/ai-analysis-evidence.test.ts`
- `packages/shared/src/lib/ai-run-center.ts`
- `packages/shared/src/lib/ai-run-center.logic.ts`
- `packages/shared/src/lib/ai-run-center.test.ts`
- `packages/shared/src/lib/ai-runtime-settings.ts`

No barrel re-exports of these in `packages/shared/src/index.ts` (it only re-exports `./db/index`). Good — imports are direct subpath imports.

## Questions for the user before Phase B can run

1. **`ai-dashboard-actions.ts` and `live-dashboard.ts`'s merge of `aiActions`.** This is the load-bearing one. Options:
   - (a) Delete `ai-dashboard-actions.ts`; remove the `aiActions` merge block (lines 1313–1338) from `live-dashboard.ts` so it only emits deterministic actions. Net effect: workspace action board loses any AI-tagged actions. This matches "AI report pipeline is dead."
   - (b) Keep both files and the tables `ai_analysis_runs` + `ai_recommendations` as read-only historical data.
   - Recommended: **(a).** It is the only option consistent with the stated goal.
2. **Admin `ai-prompts` page + API + `ai_prompt_templates` table.** Pure dead-pipeline admin surface. Options:
   - (a) Delete page, API, table.
   - (b) Keep table, delete UI.
   - Recommended: **(a).**
3. **Dashboard `?view=ai-insights` branch + `AiRunCenterView`.** Pure dead-pipeline UI in the user-facing dashboard.
   - Recommended: **delete the branch and the `AiRunCenterView` component**, plus the import of `getAiRunCenterData`.
4. **`property-refresh-worker.ts`** calls `runAiAnalysisForPropertyWindow`. The instruction excluded `property-refresh-policy.ts` from the constraint list but the worker itself is fair game.
   - Recommended: **delete the `aiResult` block from `property-refresh-worker.ts`** so refreshes no longer trigger AI runs.
5. Confirm `ai_prompt_templates` is in the drop set (it logically belongs).

Pending answers to 1–5, Phase B is on hold.
