import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { aiAnalysisRuns, aiRecommendations } from "@webhealth/shared/db/schema";
import {
  buildAiActionIdentity,
  type AiRecommendation,
} from "@webhealth/shared/lib/ai-analysis";
import type { WeeklyActionRow } from "@webhealth/shared/lib/action-types";

type AiActionIdentity = ReturnType<typeof buildAiActionIdentity>;

function aiRecommendationToWeeklyAction(params: {
  recommendation: AiRecommendation;
  aiRunId: string;
  rank: number;
}): WeeklyActionRow {
  const targetValue = params.recommendation.target?.value ?? params.recommendation.title;
  return {
    id: `weekly_ai_${params.recommendation.id}`,
    rank: params.rank,
    area: params.recommendation.area,
    title: params.recommendation.title,
    whyNow: params.recommendation.summary,
    source: "ai",
    aiRunId: params.aiRunId,
    evidenceAnchors: params.recommendation.evidenceAnchors,
    clientSafeSummary: params.recommendation.clientSafeSummary,
    recommendationClass: "lift",
    primaryMetric: params.recommendation.area === "technical" ? "crawl_health" : "clicks",
    expectedDirection: "improve",
    successWindow: "14-42d",
    successSignal: "Evidence-backed movement in the cited URL, query, or issue scope.",
    timeToValue: "weeks",
    firstVisibleWin: params.recommendation.clientSafeSummary,
    valueAtStake: {},
    confidenceLabel: params.recommendation.confidence,
    confidenceScore:
      params.recommendation.confidence === "high"
        ? 0.9
        : params.recommendation.confidence === "medium"
          ? 0.7
          : 0.45,
    confidenceBasis: "AI review with at least two evidence anchors.",
    owner: params.recommendation.area === "technical" ? "developer" : "seo",
    effort: params.recommendation.area === "technical" ? "M" : "S",
    priorityReason: params.recommendation.summary,
    targetPage: params.recommendation.target?.type === "url" ? targetValue : null,
    supportingQueries: params.recommendation.target?.type === "query" ? [targetValue] : [],
    detail: {
      observed: params.recommendation.evidenceAnchors.map((anchor) => `${anchor.label}: ${anchor.value}`),
      likelyCauses: [params.recommendation.summary],
      recommendedActions: [params.recommendation.clientSafeSummary],
      whyThisHelps: ["The recommendation is tied to current source evidence."],
      expectedOutcome: ["Verify the cited signal in the next refreshed window."],
      evidence: {
        deterministic: params.recommendation.evidenceAnchors.map((anchor) => ({
          label: anchor.label,
          value: anchor.value,
        })),
        inferred: [],
      },
    },
  };
}

export async function getLatestCompleteAiActions(params: {
  teamId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  compareMode: string;
  compareStartDate: string | null;
  compareEndDate: string | null;
}): Promise<Array<WeeklyActionRow & AiActionIdentity>> {
  const run = await db.query.aiAnalysisRuns.findFirst({
    where: and(
      eq(aiAnalysisRuns.teamId, params.teamId),
      eq(aiAnalysisRuns.propertyId, params.propertyId),
      eq(aiAnalysisRuns.status, "complete"),
      eq(aiAnalysisRuns.startDate, params.startDate),
      eq(aiAnalysisRuns.endDate, params.endDate),
      eq(aiAnalysisRuns.compareMode, params.compareMode),
      params.compareStartDate
        ? eq(aiAnalysisRuns.compareStartDate, params.compareStartDate)
        : isNull(aiAnalysisRuns.compareStartDate),
      params.compareEndDate
        ? eq(aiAnalysisRuns.compareEndDate, params.compareEndDate)
        : isNull(aiAnalysisRuns.compareEndDate),
    ),
    orderBy: [desc(aiAnalysisRuns.updatedAt)],
  });
  if (!run) return [];

  const rows = await db.query.aiRecommendations.findMany({
    where: eq(aiRecommendations.aiRunId, run.id),
    orderBy: [aiRecommendations.createdAt],
    limit: 4,
  });

  return rows
    .map((row, index) => {
      const recommendation = row.rawRecommendation as AiRecommendation;
      if (!recommendation.target) return null;
      return {
        ...aiRecommendationToWeeklyAction({
          recommendation,
          aiRunId: run.id,
          rank: index + 1,
        }),
        ...buildAiActionIdentity({
          target: recommendation.target,
          title: recommendation.title,
        }),
      };
    })
    .filter((row): row is WeeklyActionRow & AiActionIdentity => Boolean(row));
}
