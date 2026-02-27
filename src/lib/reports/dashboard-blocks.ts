import { z } from "zod";

// ─── Primitive column schema ──────────────────────────────────────────────────
const columnSchema = z.string();

// ─── KPI Cards Block ──────────────────────────────────────────────────────────
export const kpiCardsBlockSchema = z.object({
  type: z.literal("kpi_cards"),
  rows: z.array(
    z.object({
      metric: z.string(),
      previous: z.string(),
      current: z.string(),
      delta: z.string(),
      assessment: z.string(),
    })
  ),
});
export type KpiCardsBlock = z.infer<typeof kpiCardsBlockSchema>;

// ─── Time Series Block ────────────────────────────────────────────────────────
export const timeSeriesBlockSchema = z.object({
  type: z.literal("time_series"),
  metric: z.string(), // e.g. "clicks", "sessions"
  label: z.string(),  // human-readable label
  currentSeries: z.array(
    z.object({ date: z.string(), value: z.number() })
  ),
  compareSeries: z.array(
    z.object({ date: z.string(), value: z.number() })
  ),
});
export type TimeSeriesBlock = z.infer<typeof timeSeriesBlockSchema>;

// ─── Table Block ──────────────────────────────────────────────────────────────
export const drilldownPayloadSchema = z.union([
  // Query drilldown
  z.object({
    type: z.literal("query"),
    query: z.string(),
    topPages: z.array(
      z.object({
        page: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        ctr: z.number(),
        position: z.number(),
        positionDelta: z.number(),
      })
    ),
    recommendedPrimaryPage: z.string().nullable(),
    deviceSplit: z.array(
      z.object({ device: z.string(), clicks: z.number(), impressions: z.number() })
    ),
    countrySplit: z.array(
      z.object({ country: z.string(), clicks: z.number(), impressions: z.number() })
    ),
  }),
  // Page drilldown
  z.object({
    type: z.literal("page"),
    page: z.string(),
    topQueries: z.array(
      z.object({
        query: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        ctr: z.number(),
        position: z.number(),
        intent: z.string(),
      })
    ),
    gscDeltas: z.object({
      clicksDelta: z.number(),
      impressionsDelta: z.number(),
      positionDelta: z.number(),
    }),
    ga4Organic: z
      .object({
        sessions: z.number(),
        engagedSessions: z.number(),
        engagementRate: z.number(),
        bounceRate: z.number(),
      })
      .nullable(),
    crawlFlags: z.object({
      missingTitle: z.boolean(),
      missingMeta: z.boolean(),
      multipleH1: z.boolean(),
      canonicalIssue: z.boolean(),
    }),
  }),
]);
export type DrilldownPayload = z.infer<typeof drilldownPayloadSchema>;

export const tableBlockSchema = z.object({
  type: z.literal("table"),
  id: z.string(), // e.g. "query_opportunities", "near_win_keywords"
  columns: z.array(columnSchema),
  rows: z.array(z.record(z.string(), z.unknown())),
  details: z.record(z.string(), drilldownPayloadSchema).optional(), // key = row identifier; max 50 entries
});
export type TableBlock = z.infer<typeof tableBlockSchema>;

// ─── Action Backlog Block ─────────────────────────────────────────────────────
export const actionBacklogBlockSchema = z.object({
  type: z.literal("action_backlog"),
  rows: z.array(
    z.object({
      id: z.string(),
      area: z.enum(["technical", "content", "onpage", "analytics"]),
      task: z.string(),
      ownerHint: z.enum(["developer", "seo", "content", "marketing"]),
      effort: z.enum(["S", "M", "L"]),
      impactScore: z.number(),
      why: z.string(),
      done: z.boolean(),
    })
  ),
});
export type ActionBacklogBlock = z.infer<typeof actionBacklogBlockSchema>;

// ─── Technical Issues Block ───────────────────────────────────────────────────
export const technicalIssuesBlockSchema = z.object({
  type: z.literal("technical_issues"),
  rows: z.array(
    z.object({
      issueType: z.string(),
      affectedPages: z.number(),
      affectedEstimatedClicks: z.number(),
      severity: z.enum(["KRITISCH", "HOCH", "MITTEL", "NIEDRIG"]),
      recommendation: z.string(),
    })
  ),
});
export type TechnicalIssuesBlock = z.infer<typeof technicalIssuesBlockSchema>;

// ─── Content Gaps Block ───────────────────────────────────────────────────────
export const contentGapsBlockSchema = z.object({
  type: z.literal("content_gaps"),
  rows: z.array(
    z.object({
      gapType: z.enum(["A", "B", "C"]),
      query: z.string(),
      intent: z.enum(["informational", "commercial", "navigational"]),
      primaryPage: z.string().nullable(),
      evidenceMetrics: z.object({
        impressions: z.number(),
        clicks: z.number(),
        ctr: z.number(),
        position: z.number(),
        engagementRate: z.number().optional(),
        bounceRate: z.number().optional(),
        sessions: z.number().optional(),
      }),
      suggestedAction: z.string(),
      priorityScore: z.number(),
    })
  ),
  warnings: z.array(z.string()).optional(),
});
export type ContentGapsBlock = z.infer<typeof contentGapsBlockSchema>;

// ─── Discriminated Union ──────────────────────────────────────────────────────
export const dashboardBlockSchema = z.discriminatedUnion("type", [
  kpiCardsBlockSchema,
  timeSeriesBlockSchema,
  tableBlockSchema,
  actionBacklogBlockSchema,
  technicalIssuesBlockSchema,
  contentGapsBlockSchema,
]);
export type DashboardBlock = z.infer<typeof dashboardBlockSchema>;
