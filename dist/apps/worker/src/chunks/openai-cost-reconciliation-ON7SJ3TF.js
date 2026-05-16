import {
  backfillOpenAICostLedgerFromCompletedRuns
} from "./chunk-JUBVCEZG.js";
import {
  openaiDailyCosts
} from "./chunk-W7P3RKIV.js";
import "./chunk-3LHI6BO3.js";

// packages/shared/src/lib/openai/cost-reconciler.ts
import { sql } from "drizzle-orm";
var DAY_SECONDS = 24 * 60 * 60;
function formatUtcDateFromUnixSeconds(value) {
  return new Date(value * 1e3).toISOString().slice(0, 10);
}
function slugPart(value, fallback) {
  return (value ?? fallback).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || fallback;
}
function resolveOpenAICostReconciliationWindow({
  now = /* @__PURE__ */ new Date(),
  days = 90
}) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1e3;
  const endTime = todayUtc;
  const startTime = endTime - Math.max(1, days) * DAY_SECONDS;
  return {
    startTime,
    endTime,
    startDate: formatUtcDateFromUnixSeconds(startTime),
    endDate: formatUtcDateFromUnixSeconds(endTime)
  };
}
function buildOpenAICostsApiUrl(input) {
  const url = new URL("/v1/organization/costs", input.baseUrl ?? "https://api.openai.com");
  url.searchParams.set("start_time", String(input.startTime));
  url.searchParams.set("end_time", String(input.endTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", String(input.limit ?? 31));
  url.searchParams.append("group_by", "project_id");
  url.searchParams.append("group_by", "line_item");
  if (input.page) url.searchParams.set("page", input.page);
  return url;
}
function mapOpenAICostBucketToDailyRows(bucket) {
  const sourceDate = formatUtcDateFromUnixSeconds(bucket.start_time);
  return (bucket.results ?? []).map((result) => {
    const amount = result.amount?.value ?? 0;
    const currency = result.amount?.currency?.toLowerCase() || "usd";
    const projectId = result.project_id ?? null;
    const lineItem = result.line_item ?? null;
    return {
      id: [
        "oaicost",
        sourceDate,
        slugPart(projectId, "org_unattributed"),
        slugPart(lineItem, "unclassified")
      ].join("_"),
      sourceDate,
      projectId,
      lineItem,
      amountUsd: Number(amount).toFixed(6),
      currency,
      rawBucket: bucket
    };
  });
}
async function fetchOpenAICostBuckets(input) {
  const fetcher = input.fetchFn ?? fetch;
  const buckets = [];
  let page = null;
  do {
    const url = buildOpenAICostsApiUrl({
      baseUrl: input.baseUrl,
      startTime: input.startTime,
      endTime: input.endTime,
      page
    });
    const response = await fetcher(url, {
      headers: {
        authorization: `Bearer ${input.adminKey}`
      }
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`OpenAI Costs API failed with ${response.status}`);
    }
    buckets.push(...body?.data ?? []);
    page = body?.next_page ?? null;
  } while (page);
  return buckets;
}
async function upsertOpenAIDailyCostRows(rows) {
  if (!rows.length) return { rows: 0 };
  const { db } = await import("./db-J7MSJUF6.js");
  await db.insert(openaiDailyCosts).values(rows).onConflictDoUpdate({
    target: openaiDailyCosts.id,
    set: {
      sourceDate: sql`excluded.source_date`,
      projectId: sql`excluded.project_id`,
      lineItem: sql`excluded.line_item`,
      amountUsd: sql`excluded.amount_usd`,
      currency: sql`excluded.currency`,
      rawBucket: sql`excluded.raw_bucket`,
      fetchedAt: /* @__PURE__ */ new Date()
    }
  });
  return { rows: rows.length };
}
async function reconcileOpenAIDailyCosts(input) {
  const window = resolveOpenAICostReconciliationWindow({
    now: input.now,
    days: input.days ?? 90
  });
  const buckets = await fetchOpenAICostBuckets({
    adminKey: input.adminKey,
    baseUrl: input.baseUrl,
    startTime: window.startTime,
    endTime: window.endTime,
    fetchFn: input.fetchFn
  });
  const rows = buckets.flatMap(mapOpenAICostBucketToDailyRows);
  const result = await upsertOpenAIDailyCostRows(rows);
  return { ...window, buckets: buckets.length, rows: result.rows };
}

// apps/worker/src/openai-cost-reconciliation.ts
var DEFAULT_RECONCILIATION_INTERVAL_MS = 24 * 60 * 60 * 1e3;
function requireOpenAIAdminKey(env) {
  const key = env.OPENAI_ADMIN_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_COST_RECONCILIATION_CONFIG_ERROR: OPENAI_ADMIN_KEY is required.");
  }
  return key;
}
function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function getOpenAICostReconciliationSchedulerConfig(input) {
  const env = input.env ?? process.env;
  if (input.once) return { enabled: false, reason: "once-mode" };
  if (!env.OPENAI_ADMIN_KEY?.trim()) return { enabled: false, reason: "missing-admin-key" };
  return {
    enabled: true,
    intervalMs: parsePositiveInt(
      env.OPENAI_COST_RECONCILIATION_INTERVAL_MS,
      DEFAULT_RECONCILIATION_INTERVAL_MS
    )
  };
}
async function runOpenAICostReconciliation(input = {}) {
  const env = input.env ?? process.env;
  const adminKey = requireOpenAIAdminKey(env);
  await backfillOpenAICostLedgerFromCompletedRuns();
  return reconcileOpenAIDailyCosts({
    adminKey,
    baseUrl: env.OPENAI_BASE_URL,
    days: parsePositiveInt(env.OPENAI_COST_RECONCILIATION_DAYS, 90),
    now: input.now,
    fetchFn: input.fetchFn
  });
}
function startOpenAICostReconciliationScheduler(input) {
  const config = getOpenAICostReconciliationSchedulerConfig(input);
  if (!config.enabled) {
    console.log(`[openai-costs][INFO] scheduler disabled reason=${config.reason}`);
    return null;
  }
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runOpenAICostReconciliation({ env: input.env });
      console.log(`[openai-costs][INFO] reconciled rows=${result.rows} buckets=${result.buckets}`);
    } catch (error) {
      console.error("[openai-costs][ERROR] reconciliation failed", error);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), config.intervalMs);
  return {
    stop: () => clearInterval(timer)
  };
}
export {
  getOpenAICostReconciliationSchedulerConfig,
  requireOpenAIAdminKey,
  runOpenAICostReconciliation,
  startOpenAICostReconciliationScheduler
};
