import { NextResponse } from "next/server";
import type { RecommendationState } from "@webhealth/shared/lib/reports/types";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { upsertActionItemState } from "@webhealth/shared/lib/live-dashboard";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

const ACTION_STATES = new Set<RecommendationState>([
  "open",
  "in_progress",
  "done",
  "ignored",
  "snoozed",
]);
const PRIORITY_OVERRIDES = new Set(["none", "raise", "pin", "lower"]);

export async function PATCH(
  req: Request,
  context: { params: Promise<unknown> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await context.params as { id: string };
    const propertyId = decodeRouteParam(id);
    const body = await req.json() as {
      fingerprint?: string;
      actionFamily?: string;
      causeFamily?: string;
      remedyKey?: string;
      targetType?: string;
      targetKey?: string;
      title?: string;
      owner?: string | null;
      state?: string;
      priorityOverride?: string;
      overrideReason?: string | null;
    };

    if (
      !body.fingerprint ||
      !body.actionFamily ||
      !body.causeFamily ||
      !body.remedyKey ||
      !body.targetType ||
      !body.targetKey ||
      !body.title
    ) {
      throw badRequest("ACTION_METADATA_REQUIRED", "Action identity metadata is required.");
    }

    if (
      body.state &&
      !ACTION_STATES.has(body.state as RecommendationState)
    ) {
      throw badRequest("INVALID_ACTION_STATE", "Unsupported action state.");
    }

    if (
      body.priorityOverride &&
      !PRIORITY_OVERRIDES.has(body.priorityOverride)
    ) {
      throw badRequest("INVALID_PRIORITY_OVERRIDE", "Unsupported priority override.");
    }

    if (!body.state && !body.priorityOverride) {
      throw badRequest("ACTION_UPDATE_REQUIRED", "A state or priority override update is required.");
    }

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
    });

    return NextResponse.json({ action: row });
  } catch (error) {
    return handleRouteError("PATCH /api/properties/[id]/actions error", error);
  }
}
