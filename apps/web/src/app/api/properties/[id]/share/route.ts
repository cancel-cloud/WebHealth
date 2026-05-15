import { NextResponse } from "next/server";
import { createPropertyShareLink } from "@webhealth/shared/lib/live-dashboard";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { getUserPreferredLanguage } from "@/lib/server/language";
import { handleRouteError } from "@/lib/server/route-security";
import { buildPropertyShareUrl, normalizeShareRequestBody } from "./route.logic";

export async function POST(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const body = normalizeShareRequestBody(await req.json() as Record<string, unknown>);
    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);

    const share = await createPropertyShareLink({
      teamId: membership.teamId,
      createdByUserId: session.user.id,
      propertyId: resolved.canonicalGscProperty.id,
      language: await getUserPreferredLanguage(session.user.id),
      preset: body.preset,
      compareMode: body.compareMode,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    void recordProductEvent({
      teamId: membership.teamId,
      userId: session.user.id,
      name: "snapshot_share_created",
      source: "snapshot",
      entityType: "share",
      entityId: share.shareId,
      properties: {
        propertyId: resolved.canonicalGscProperty.id,
        preset: body.preset,
        compareMode: body.compareMode,
      },
    }).catch(() => {});

    return NextResponse.json({
      shareId: share.shareId,
      token: share.token,
      expiresAt: share.expiresAt,
      shareUrl: buildPropertyShareUrl({
        requestUrl: req.url,
        token: share.token,
        baseUrl: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
      }),
    });
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/share error", error);
  }
}
