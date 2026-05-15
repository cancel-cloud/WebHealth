import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import {
  metricsBackfillJobs,
  openaiCostLedger,
  openaiDailyCosts,
  propertyRefreshJobs,
} from "@webhealth/shared/db/schema";
import { desc, sql } from "drizzle-orm";
import { buildUnifiedJobActivity } from "./route.logic";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    await requireAdminSession();

    const [dailyCosts, estimatedDailyCosts, metricsJobs, propertyRefreshJobRows] = await Promise.all([
      db
        .select({
          sourceDate: openaiDailyCosts.sourceDate,
          totalUsd: sql<string>`sum(${openaiDailyCosts.amountUsd})::text`,
        })
        .from(openaiDailyCosts)
        .groupBy(openaiDailyCosts.sourceDate)
        .orderBy(desc(openaiDailyCosts.sourceDate))
        .limit(14),
      db
        .select({
          sourceDate: sql<string>`${openaiCostLedger.createdAt}::date::text`,
          totalUsd: sql<string>`sum(${openaiCostLedger.costEstimateUsd})::text`,
        })
        .from(openaiCostLedger)
        .where(sql`${openaiCostLedger.outcome} = 'succeeded'`)
        .groupBy(sql`${openaiCostLedger.createdAt}::date`)
        .orderBy(desc(sql`${openaiCostLedger.createdAt}::date`))
        .limit(14),
      db
        .select({
          id: metricsBackfillJobs.id,
          teamId: metricsBackfillJobs.teamId,
          targetPropertyId: metricsBackfillJobs.targetPropertyId,
          includeGsc: metricsBackfillJobs.includeGsc,
          includeGa4: metricsBackfillJobs.includeGa4,
          reason: metricsBackfillJobs.reason,
          status: metricsBackfillJobs.status,
          triggerSource: metricsBackfillJobs.triggerSource,
          totals: metricsBackfillJobs.totals,
          error: metricsBackfillJobs.error,
          attempts: metricsBackfillJobs.attempts,
          maxAttempts: metricsBackfillJobs.maxAttempts,
          claimedBy: metricsBackfillJobs.claimedBy,
          claimExpiresAt: metricsBackfillJobs.claimExpiresAt,
          heartbeatAt: metricsBackfillJobs.heartbeatAt,
          createdAt: metricsBackfillJobs.createdAt,
          startedAt: metricsBackfillJobs.startedAt,
          finishedAt: metricsBackfillJobs.finishedAt,
        })
        .from(metricsBackfillJobs)
        .orderBy(desc(metricsBackfillJobs.createdAt))
        .limit(100),
      db
        .select({
          id: propertyRefreshJobs.id,
          teamId: propertyRefreshJobs.teamId,
          propertyId: propertyRefreshJobs.propertyId,
          jobType: propertyRefreshJobs.jobType,
          status: propertyRefreshJobs.status,
          phase: propertyRefreshJobs.phase,
          message: propertyRefreshJobs.message,
          progressMeta: propertyRefreshJobs.progressMeta,
          lastError: propertyRefreshJobs.lastError,
          attempts: propertyRefreshJobs.attempts,
          maxAttempts: propertyRefreshJobs.maxAttempts,
          claimedBy: propertyRefreshJobs.claimedBy,
          claimExpiresAt: propertyRefreshJobs.claimExpiresAt,
          heartbeatAt: propertyRefreshJobs.heartbeatAt,
          createdAt: propertyRefreshJobs.createdAt,
          updatedAt: propertyRefreshJobs.updatedAt,
          startedAt: propertyRefreshJobs.startedAt,
          finishedAt: propertyRefreshJobs.finishedAt,
        })
        .from(propertyRefreshJobs)
        .orderBy(desc(propertyRefreshJobs.createdAt))
        .limit(100),
    ]);

    const jobActivity = buildUnifiedJobActivity({
      metricsJobs,
      propertyRefreshJobs: propertyRefreshJobRows,
      limit: 150,
    });

    const stats = {
      queued: jobActivity.counts.sourceData.queued + jobActivity.counts.propertyRefresh.queued,
      processing: jobActivity.counts.sourceData.active + jobActivity.counts.propertyRefresh.active,
      failed: jobActivity.counts.sourceData.failed + jobActivity.counts.propertyRefresh.failed,
      total: jobActivity.counts.sourceData.total + jobActivity.counts.propertyRefresh.total,
    };

    return NextResponse.json({
      stats,
      jobs: [],
      dailyCosts,
      estimatedDailyCosts,
      detailRequests: [],
      jobActivity,
    });
  } catch (error) {
    return handleRouteError("Error fetching AI debug data", error);
  }
}
