import { NextResponse } from "next/server";
import {
  createSnapshotExport,
  getSnapshotExportDetail,
} from "@webhealth/shared/lib/live-dashboard";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { getUserPreferredLanguage } from "@/lib/server/language";
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
    const snapshotId = new URL(req.url).searchParams.get("snapshotId");

    if (!snapshotId) {
      return NextResponse.json(
        { error: "snapshotId is required." },
        { status: 400 },
      );
    }

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const snapshot = await getSnapshotExportDetail({
      teamId: membership.teamId,
      propertyId: resolved.canonicalGscProperty.id,
      snapshotId,
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return handleRouteError("GET /api/properties/[id]/snapshots error", error);
  }
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
      preset?: string | null;
      compareMode?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    };

    const resolved = await resolveTeamReportSources(membership.teamId, propertyId);
    const snapshot = await createSnapshotExport({
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
      name: "snapshot_captured",
      source: "snapshot",
      entityType: "snapshot",
      entityId: snapshot.id,
      properties: {
        propertyId: resolved.canonicalGscProperty.id,
        preset: body.preset,
        compareMode: body.compareMode,
      },
    }).catch(() => {});

    return NextResponse.json({ snapshot });
  } catch (error) {
    return handleRouteError("POST /api/properties/[id]/snapshots error", error);
  }
}
