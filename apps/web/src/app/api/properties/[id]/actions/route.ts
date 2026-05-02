import { NextResponse } from "next/server";
import type { RecommendationState } from "@webhealth/shared/lib/action-types";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { upsertActionItemState } from "@webhealth/shared/lib/live-dashboard";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";
import { normalizeActionUpdateBody } from "./route.logic";

export async function PATCH(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const body = normalizeActionUpdateBody(await req.json() as Record<string, unknown>);

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const row = await upsertActionItemState({
      teamId: membership.teamId,
      propertyId: resolved.canonicalGscProperty.id,
      fingerprint: body.fingerprint,
      actionFamily: body.actionFamily,
      causeFamily: body.causeFamily,
      remedyKey: body.remedyKey,
      targetType: body.targetType,
      targetKey: body.targetKey,
      title: body.title,
      owner: body.owner ?? null,
      state: body.state as RecommendationState | undefined,
      priorityOverride: body.priorityOverride as "none" | "raise" | "pin" | "lower" | undefined,
      overrideReason: body.overrideReason ?? null,
      overrideUpdatedByUserId: session.user.id,
      assigneeUserId: body.assigneeUserId,
      assigneeEmail: body.assigneeEmail,
      snoozedUntil: body.snoozedUntil,
    });

    if (body.state) {
      void recordProductEvent({
        teamId: membership.teamId,
        userId: session.user.id,
        name: "action_state_changed",
        source: "property_dashboard",
        entityType: "action",
        entityId: row.id,
        properties: {
          propertyId: resolved.canonicalGscProperty.id,
          fingerprint: body.fingerprint,
          state: body.state,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ action: row });
  } catch (error) {
    return handleRouteError("PATCH /api/properties/[id]/actions error", error);
  }
}
