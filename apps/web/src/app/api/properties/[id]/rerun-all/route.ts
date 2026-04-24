import { NextResponse } from "next/server";
import { createMetricsBackfillJob, processMetricsBackfillJob } from "@webhealth/shared/lib/metrics-cache";
import { enqueuePropertyRefreshJob } from "@webhealth/shared/lib/property-refresh";
import { getGoogleAuthClient } from "@webhealth/shared/lib/google/api";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";
import {
  buildRerunAllResponse,
  earlierDate,
  normalizeRerunAllRequestBody,
} from "./route.logic";

export async function POST(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const body = normalizeRerunAllRequestBody(await req.json() as Record<string, unknown>);
    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const canonicalProperty = resolved.canonicalGscProperty;
    const refreshStart = body.compareStartDate
      ? earlierDate(body.compareStartDate, body.startDate)
      : body.startDate;

    let dataRefresh: ReturnType<typeof buildRerunAllResponse>["dataRefresh"];
    try {
      const googleAccount = await getGoogleAccountTokensForUser(session.user.id);
      if (!googleAccount?.accessToken) {
        throw new Error("Google account not linked. Reconnect Google to refresh GA4 and Search Console.");
      }

      const authClient = getGoogleAuthClient(
        googleAccount.accessToken,
        googleAccount.refreshToken ?? undefined,
        googleAccount.accessTokenExpiresAt ?? null,
      );
      const job = await createMetricsBackfillJob({
        teamId: membership.teamId,
        triggeredByUserId: session.user.id,
        targetPropertyId: canonicalProperty.id,
        includeGsc: true,
        includeGa4: Boolean(canonicalProperty.ga4PropertyId),
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
      dataRefresh = {
        status: result.status === "failed" ? "failed" : "complete",
        jobId: job.id,
        message: result.status === "failed" ? "Source data refresh failed." : "GA4 and Search Console refreshed.",
      };
    } catch (error) {
      dataRefresh = {
        status: "failed",
        message: error instanceof Error ? error.message : "Source data refresh failed.",
      };
    }

    const refreshPayload = {
      preset: body.preset,
      compareMode: body.compareMode,
      startDate: body.startDate,
      endDate: body.endDate,
    };
    const crawlJob = await enqueuePropertyRefreshJob({
      teamId: membership.teamId,
      propertyId: canonicalProperty.id,
      triggeredByUserId: session.user.id,
      jobType: "crawl_refresh",
      payload: refreshPayload,
    });
    const decisionJob = await enqueuePropertyRefreshJob({
      teamId: membership.teamId,
      propertyId: canonicalProperty.id,
      triggeredByUserId: session.user.id,
      jobType: "decision_refresh",
      payload: refreshPayload,
    });

    return NextResponse.json(buildRerunAllResponse({
      dataRefresh,
      crawlRefresh: {
        status: "queued",
        jobId: crawlJob.id,
        message: crawlJob.message,
      },
      decisionRefresh: {
        status: "queued",
        jobId: decisionJob.id,
        message: decisionJob.message,
      },
    }));
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/rerun-all error", error);
  }
}
