import { NextResponse } from "next/server";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { getGoogleAuthClient } from "@webhealth/shared/lib/google/api";
import { createMetricsBackfillJob, processMetricsBackfillJob } from "@webhealth/shared/lib/metrics-cache";
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

function earlierDate(left: string, right: string) {
  return left <= right ? left : right;
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

    const refreshStart = isDateString(body.compareStartDate)
      ? earlierDate(body.compareStartDate, body.startDate)
      : body.startDate;

    const authClient = getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken ?? undefined,
      googleAccount.accessTokenExpiresAt ?? null,
    );

    const job = await createMetricsBackfillJob({
      teamId: membership.teamId,
      triggeredByUserId: session.user.id,
      targetPropertyId: resolved.canonicalGscProperty.id,
      includeGsc: true,
      includeGa4: Boolean(resolved.canonicalGscProperty.ga4PropertyId),
      dateStart: refreshStart,
      dateEnd: body.endDate,
      reason: "manual_backfill",
      timeframeMode: "custom",
      refreshRecentDays: 14,
    });

    const result = await processMetricsBackfillJob({
      jobId: job.id,
      authClient,
    });

    return NextResponse.json({
      jobId: job.id,
      status: result.status,
      dateStart: refreshStart,
      dateEnd: body.endDate,
      totals: result.totals,
    });
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/refresh-data error", error);
  }
}
