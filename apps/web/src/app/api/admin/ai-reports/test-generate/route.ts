import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

function throwSafePropertyResolutionError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Property not found for team";
  if (/not linked to a Google Search Console property/i.test(message)) {
    throw badRequest(
      "INVALID_PROPERTY",
      "The selected property is not linked to a Google Search Console property"
    );
  }
  throw badRequest("PROPERTY_NOT_FOUND", "Property not found for team");
}

function fmt(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const body = (await req.json()) as {
      teamId?: string;
      propertyId?: string;
      options?: { modelOverride?: string; runXlsx?: boolean; sitemapUrlOverride?: string };
    };
    if (!body.teamId || !body.propertyId) {
      throw badRequest("TEAM_AND_PROPERTY_REQUIRED", "teamId and propertyId are required");
    }

    let resolvedSources;
    try {
      resolvedSources = await resolveTeamReportSources(body.teamId, body.propertyId);
    } catch (error) {
      throwSafePropertyResolutionError(error);
    }

    const end = subDays(new Date(), 1);
    const start = subDays(end, 27);
    const compareEnd = subDays(start, 1);
    const compareStart = subDays(compareEnd, 27);

    const reportId = `rep_${nanoid(12)}`;
    const [report] = await db
      .insert(reports)
      .values({
        id: reportId,
        teamId: body.teamId,
        propertyId: resolvedSources.canonicalReportPropertyId,
        dateRangeStart: fmt(start),
        dateRangeEnd: fmt(end),
        compareRangeStart: fmt(compareStart),
        compareRangeEnd: fmt(compareEnd),
        status: "queued",
        aiStatus: "queued",
        xlsxStatus: "pending",
      })
      .returning();

    await enqueueReportJob({
      reportId,
      teamId: body.teamId,
      kind: "generate_report",
      payload: {
        runXlsx: body.options?.runXlsx ?? true,
        source: "admin_test_generate",
        modelOverride: body.options?.modelOverride ?? null,
        sitemapUrlOverride: body.options?.sitemapUrlOverride ?? null,
      },
    });

    return NextResponse.json({
      reportId,
      report,
      selectedPropertyId: body.propertyId,
      canonicalPropertyId: resolvedSources.canonicalReportPropertyId,
    });
  } catch (error) {
    return handleRouteError("Error queueing admin test report", error);
  }
}
