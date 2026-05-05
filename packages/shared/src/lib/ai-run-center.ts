import { desc, eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { aiAnalysisRuns, aiRecommendations, properties } from "@webhealth/shared/db/schema";
import { buildAiRunCenterCounts } from "./ai-run-center.logic";

export type AiRunCenterRun = {
  id: string;
  propertyId: string;
  propertyName: string;
  status: string;
  phase: string;
  analyzerModel: string | null;
  costEstimateUsd: string | null;
  error: string | null;
  updatedAt: string;
};

export type AiRunCenterRecommendation = {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  area: string;
  confidence: string;
  targetKey: string;
  createdAt: string;
};

export type AiRunCenterData = {
  counts: {
    queued: number;
    processing: number;
    complete: number;
    failed: number;
    total: number;
  };
  estimatedCostUsd: number;
  runs: AiRunCenterRun[];
  recommendations: AiRunCenterRecommendation[];
};

export async function getAiRunCenterData(teamId: string): Promise<AiRunCenterData> {
  const [runRows, recommendationRows] = await Promise.all([
    db
      .select({
        id: aiAnalysisRuns.id,
        propertyId: aiAnalysisRuns.propertyId,
        propertyName: properties.name,
        status: aiAnalysisRuns.status,
        phase: aiAnalysisRuns.phase,
        analyzerModel: aiAnalysisRuns.analyzerModel,
        costEstimateUsd: aiAnalysisRuns.costEstimateUsd,
        error: aiAnalysisRuns.error,
        updatedAt: aiAnalysisRuns.updatedAt,
      })
      .from(aiAnalysisRuns)
      .leftJoin(properties, eq(properties.id, aiAnalysisRuns.propertyId))
      .where(eq(aiAnalysisRuns.teamId, teamId))
      .orderBy(desc(aiAnalysisRuns.updatedAt))
      .limit(25),
    db
      .select({
        id: aiRecommendations.id,
        propertyId: aiRecommendations.propertyId,
        propertyName: properties.name,
        title: aiRecommendations.title,
        area: aiRecommendations.area,
        confidence: aiRecommendations.confidence,
        targetKey: aiRecommendations.targetKey,
        createdAt: aiRecommendations.createdAt,
      })
      .from(aiRecommendations)
      .leftJoin(properties, eq(properties.id, aiRecommendations.propertyId))
      .where(eq(aiRecommendations.teamId, teamId))
      .orderBy(desc(aiRecommendations.createdAt))
      .limit(10),
  ]);

  const runs = runRows.map((row) => ({
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.propertyName ?? row.propertyId,
    status: row.status,
    phase: row.phase,
    analyzerModel: row.analyzerModel,
    costEstimateUsd: row.costEstimateUsd == null ? null : String(row.costEstimateUsd),
    error: row.error,
    updatedAt: row.updatedAt.toISOString(),
  }));
  const summary = buildAiRunCenterCounts(runs);

  return {
    ...summary,
    runs,
    recommendations: recommendationRows.map((row) => ({
      id: row.id,
      propertyId: row.propertyId,
      propertyName: row.propertyName ?? row.propertyId,
      title: row.title,
      area: row.area,
      confidence: row.confidence,
      targetKey: row.targetKey,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
