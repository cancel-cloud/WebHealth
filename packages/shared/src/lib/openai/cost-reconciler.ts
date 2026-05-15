import { sql } from "drizzle-orm";
import { openaiDailyCosts } from "@webhealth/shared/db/schema";

export type OpenAICostResult = {
  object?: string;
  amount?: {
    value?: number;
    currency?: string;
  };
  project_id?: string | null;
  line_item?: string | null;
};

export type OpenAICostBucket = {
  object?: string;
  start_time: number;
  end_time?: number;
  results?: OpenAICostResult[];
};

export type OpenAICostsApiResponse = {
  object?: string;
  data?: OpenAICostBucket[];
  next_page?: string | null;
};

export type OpenAICostDailyRow = {
  id: string;
  sourceDate: string;
  projectId: string | null;
  lineItem: string | null;
  amountUsd: string;
  currency: string;
  rawBucket: unknown;
};

const DAY_SECONDS = 24 * 60 * 60;

function formatUtcDateFromUnixSeconds(value: number) {
  return new Date(value * 1000).toISOString().slice(0, 10);
}

function slugPart(value: string | null | undefined, fallback: string) {
  return (value ?? fallback)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;
}

export function resolveOpenAICostReconciliationWindow({
  now = new Date(),
  days = 90,
}: {
  now?: Date;
  days?: number;
}) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000;
  const endTime = todayUtc;
  const startTime = endTime - Math.max(1, days) * DAY_SECONDS;
  return {
    startTime,
    endTime,
    startDate: formatUtcDateFromUnixSeconds(startTime),
    endDate: formatUtcDateFromUnixSeconds(endTime),
  };
}

export function buildOpenAICostsApiUrl(input: {
  baseUrl?: string;
  startTime: number;
  endTime: number;
  limit?: number;
  page?: string | null;
}) {
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

export function mapOpenAICostBucketToDailyRows(bucket: OpenAICostBucket): OpenAICostDailyRow[] {
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
        slugPart(lineItem, "unclassified"),
      ].join("_"),
      sourceDate,
      projectId,
      lineItem,
      amountUsd: Number(amount).toFixed(6),
      currency,
      rawBucket: bucket,
    };
  });
}

export async function fetchOpenAICostBuckets(input: {
  adminKey: string;
  baseUrl?: string;
  startTime: number;
  endTime: number;
  fetchFn?: typeof fetch;
}) {
  const fetcher = input.fetchFn ?? fetch;
  const buckets: OpenAICostBucket[] = [];
  let page: string | null = null;

  do {
    const url = buildOpenAICostsApiUrl({
      baseUrl: input.baseUrl,
      startTime: input.startTime,
      endTime: input.endTime,
      page,
    });
    const response = await fetcher(url, {
      headers: {
        authorization: `Bearer ${input.adminKey}`,
      },
    });
    const body = await response.json().catch(() => null) as OpenAICostsApiResponse | null;
    if (!response.ok) {
      throw new Error(`OpenAI Costs API failed with ${response.status}`);
    }
    buckets.push(...(body?.data ?? []));
    page = body?.next_page ?? null;
  } while (page);

  return buckets;
}

export async function upsertOpenAIDailyCostRows(rows: OpenAICostDailyRow[]) {
  if (!rows.length) return { rows: 0 };

  const { db } = await import("@webhealth/shared/db");
  await db
    .insert(openaiDailyCosts)
    .values(rows)
    .onConflictDoUpdate({
      target: openaiDailyCosts.id,
      set: {
        sourceDate: sql`excluded.source_date`,
        projectId: sql`excluded.project_id`,
        lineItem: sql`excluded.line_item`,
        amountUsd: sql`excluded.amount_usd`,
        currency: sql`excluded.currency`,
        rawBucket: sql`excluded.raw_bucket`,
        fetchedAt: new Date(),
      },
    });

  return { rows: rows.length };
}

export async function reconcileOpenAIDailyCosts(input: {
  adminKey: string;
  baseUrl?: string;
  days?: number;
  now?: Date;
  fetchFn?: typeof fetch;
}) {
  const window = resolveOpenAICostReconciliationWindow({
    now: input.now,
    days: input.days ?? 90,
  });
  const buckets = await fetchOpenAICostBuckets({
    adminKey: input.adminKey,
    baseUrl: input.baseUrl,
    startTime: window.startTime,
    endTime: window.endTime,
    fetchFn: input.fetchFn,
  });
  const rows = buckets.flatMap(mapOpenAICostBucketToDailyRows);
  const result = await upsertOpenAIDailyCostRows(rows);
  return { ...window, buckets: buckets.length, rows: result.rows };
}
