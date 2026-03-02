import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";

const ADMIN_EMAIL = "lukas@devbrew.dev";

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json()) as {
      teamId?: string;
      propertyId?: string;
      options?: { modelOverride?: string; runXlsx?: boolean; sitemapUrlOverride?: string };
    };
    if (!body.teamId || !body.propertyId) {
      return NextResponse.json({ error: "teamId and propertyId are required" }, { status: 400 });
    }

    let resolvedSources;
    try {
      resolvedSources = await resolveTeamReportSources(body.teamId, body.propertyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Property not found for team";
      const status = /not linked to a Google Search Console property/i.test(message) ? 400 : 404;
      return NextResponse.json({ error: message }, { status });
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
