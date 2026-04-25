import { NextResponse } from "next/server";
import {
  getLatestDashboardPayloadVersion,
} from "@webhealth/shared/lib/live-dashboard";
import { getLatestPropertyRefreshStateForWindow } from "@webhealth/shared/lib/property-refresh";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const requestUrl = new URL(req.url);
    const currentPayloadVersion = requestUrl.searchParams.get("currentPayloadVersion");

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const canonicalPropertyId = resolved.canonicalGscProperty.id;
    const [refreshState, latestPayloadVersion] = await Promise.all([
      getLatestPropertyRefreshStateForWindow({
        teamId: membership.teamId,
        propertyId: canonicalPropertyId,
        payload: {
          preset: requestUrl.searchParams.get("preset"),
          compareMode: requestUrl.searchParams.get("compare"),
          startDate: requestUrl.searchParams.get("start"),
          endDate: requestUrl.searchParams.get("end"),
        },
      }),
      getLatestDashboardPayloadVersion({
        teamId: membership.teamId,
        propertyId: canonicalPropertyId,
      }),
    ]);

    return NextResponse.json({
      refreshState,
      latestPayloadVersion,
      hasNewerPayload: !!latestPayloadVersion && !!currentPayloadVersion && latestPayloadVersion !== currentPayloadVersion,
      isActive: refreshState?.status === "queued" || refreshState?.status === "processing",
      isTerminal: refreshState?.status === "complete" || refreshState?.status === "failed",
      userId: session.user.id,
    });
  } catch (error) {
    return handleRouteError("GET /api/properties/[id]/status error", error);
  }
}
