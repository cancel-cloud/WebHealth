import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { openaiDailyCosts, reports } from "@webhealth/shared/db/schema";
import { getReportQueueStats, listRecentReportJobs } from "@webhealth/shared/lib/queue/report-jobs";
import { desc, inArray, sql } from "drizzle-orm";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [stats, jobs] = await Promise.all([getReportQueueStats(), listRecentReportJobs(50)]);
    const reportIds = [...new Set(jobs.map((j) => j.reportId))];
    const relatedReports = reportIds.length
      ? await db
          .select({
            id: reports.id,
            propertyId: reports.propertyId,
            status: reports.status,
            aiStatus: reports.aiStatus,
            xlsxStatus: reports.xlsxStatus,
            aiEstimatedCostUsd: reports.aiEstimatedCostUsd,
            aiUsage: reports.aiUsage,
            openaiRequestIds: reports.openaiRequestIds,
          })
          .from(reports)
          .where(inArray(reports.id, reportIds))
      : [];

    const reportMap = new Map(relatedReports.map((r) => [r.id, r]));
    const jobsWithReports = jobs.map((job) => ({
      ...job,
      report: reportMap.get(job.reportId) ?? null,
    }));

    const dailyCosts = await db
      .select({
        sourceDate: openaiDailyCosts.sourceDate,
        totalUsd: sql<string>`sum(${openaiDailyCosts.amountUsd})::text`,
      })
      .from(openaiDailyCosts)
      .groupBy(openaiDailyCosts.sourceDate)
      .orderBy(desc(openaiDailyCosts.sourceDate))
      .limit(14);

    return NextResponse.json({ stats, jobs: jobsWithReports, dailyCosts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
