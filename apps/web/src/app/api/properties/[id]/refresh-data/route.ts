import { NextResponse } from "next/server";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { createMetricsBackfillJob } from "@webhealth/shared/lib/metrics-cache";
import {
  planMetricsRefreshWindows,
  summarizeMetricsRefreshWindows,
} from "@webhealth/shared/lib/metrics-window-policy";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

function isDateString(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const body = await req.json() as {
      startDate?: string | null;
      endDate?: string | null;
      compareStartDate?: string | null;
      compareEndDate?: string | null;
    };

    if (!isDateString(body.startDate) || !isDateString(body.endDate)) {
      throw badRequest("INVALID_REFRESH_WINDOW", "A valid startDate and endDate are required.");
    }

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const googleAccount = await getGoogleAccountTokensForUser(session.user.id);

    if (!googleAccount?.accessToken) {
      throw badRequest("GOOGLE_ACCOUNT_NOT_LINKED", "Google account not linked. Reconnect Google to refresh data.");
    }

    let windows: ReturnType<typeof planMetricsRefreshWindows>;
    try {
      windows = planMetricsRefreshWindows({
        startDate: body.startDate,
        endDate: body.endDate,
        compareStartDate: body.compareStartDate,
        compareEndDate: body.compareEndDate,
      });
    } catch (error) {
      throw badRequest(
        "INVALID_REFRESH_WINDOW",
        error instanceof Error ? error.message : "A valid refresh window is required.",
      );
    }

    const jobs = [];
    for (const window of windows) {
      jobs.push(await createMetricsBackfillJob({
        teamId: membership.teamId,
        triggeredByUserId: session.user.id,
        targetUserId: session.user.id,
        targetPropertyId: resolved.canonicalGscProperty.id,
        includeGsc: true,
        includeGa4: Boolean(resolved.canonicalGscProperty.ga4PropertyId),
        dateStart: window.dateStart,
        dateEnd: window.dateEnd,
        reason: "manual_backfill",
        timeframeMode: "custom",
        refreshRecentDays: 14,
        triggerSource: "manual",
      }));
    }
    const summary = summarizeMetricsRefreshWindows(windows);

    return NextResponse.json({
      jobId: jobs[0]?.id ?? null,
      jobIds: jobs.map((job) => job.id),
      status: jobs[0]?.status ?? "queued",
      dateStart: summary.dateStart,
      dateEnd: summary.dateEnd,
      windows,
    });
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/refresh-data error", error);
  }
}
