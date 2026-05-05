import { NextResponse } from "next/server";
import { enqueuePropertyRefreshJob } from "@webhealth/shared/lib/property-refresh";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

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
      preset?: string | null;
      compareMode?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    };

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const job = await enqueuePropertyRefreshJob({
      teamId: membership.teamId,
      propertyId: resolved.canonicalGscProperty.id,
      triggeredByUserId: session.user.id,
      jobType: "crawl_refresh",
      triggerSource: "manual",
      payload: {
        preset: body.preset ?? null,
        compareMode: body.compareMode ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
      },
    });

    return NextResponse.json({ refresh: job });
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/refresh-technical error", error);
  }
}
