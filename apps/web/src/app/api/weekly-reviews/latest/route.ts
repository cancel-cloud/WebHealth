import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    const session = await requireUnrestrictedSession();
    const memberships = await requireAnyTeamMembership(session);
    const teamId = memberships[0].teamId;

    const [watchedReviews, latestRuns] = await Promise.all([
      db.query.propertyWeeklyReviews.findMany({
        where: (review, { and, eq }) => and(eq(review.teamId, teamId), eq(review.enabled, true)),
        columns: { propertyId: true },
      }),
      db.query.weeklyReviewRuns.findMany({
        where: (run, { eq }) => eq(run.teamId, teamId),
        orderBy: (run, { desc }) => [desc(run.createdAt)],
        limit: 8,
      }),
    ]);

    const latestRun = latestRuns[0] ?? null;
    const quotaSkips = latestRuns.filter((run) => run.status === "skipped" && run.skipReason === "quota").length;

    void recordProductEvent({
      teamId,
      userId: session.user.id,
      name: "weekly_dashboard_card_viewed",
      source: "dashboard",
      entityType: latestRun ? "weekly_review_run" : null,
      entityId: latestRun?.id ?? null,
      properties: {
        watchedCount: watchedReviews.length,
        latestStatus: latestRun?.status ?? null,
        quotaSkips,
      },
    }).catch(() => {});

    return NextResponse.json({
      watchedCount: watchedReviews.length,
      quotaSkips,
      latestRun,
      trend: latestRuns
        .slice()
        .reverse()
        .map((run) => ({
          label: run.dateRangeEnd,
          actionableCount: run.actionableCount,
          status: run.status,
        })),
    });
  } catch (error) {
    return handleRouteError("Error fetching weekly review summary", error);
  }
}
