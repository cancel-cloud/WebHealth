import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import OpenAI from "openai";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";
import { estimateOpenAICostUsd } from "@webhealth/shared/lib/openai/cost-estimator";
import type { AiUsageSnapshot } from "@webhealth/shared/lib/reports/types";
import {
  computeNextDetailsCostUsd,
  findRow,
  isRowType,
  patchRowActionDetail,
} from "./route.logic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
  organization: process.env.OPENAI_ORG ?? undefined,
  project: process.env.OPENAI_PROJECT ?? undefined,
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_WRITE_RETRIES = 5;

function supportsTemperature(model: string) {
  return !model.toLowerCase().startsWith("gpt-5");
}


const detailSchema = {
  type: "object",
  properties: {
    affectedUrls: { type: "array", items: { type: "string" } },
    fixSteps: { type: "array", items: { type: "string" } },
    whyItMatters: { type: "string" },
  },
  required: ["affectedUrls", "fixSteps", "whyItMatters"],
  additionalProperties: false,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: reportId } = await params;
    const body = await req.json() as { rowType?: string; rowId?: string };
    const rowTypeValue = body.rowType;
    const rowId = body.rowId;

    if (!rowTypeValue || !rowId) {
      return NextResponse.json({ error: "rowType and rowId are required" }, { status: 400 });
    }
    if (!isRowType(rowTypeValue)) {
      return NextResponse.json({ error: "Invalid rowType" }, { status: 400 });
    }
    const rowType = rowTypeValue;

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    const teamIds = userTeams.map((row) => row.teamId);
    if (!teamIds.length) return NextResponse.json({ error: "No team found" }, { status: 400 });

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const property = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, report.propertyId),
    });

    const aiReport = report.aiReportJson as AiSeoReport | null;
    if (!aiReport) return NextResponse.json({ error: "No AI report data" }, { status: 404 });

    const rowData = findRow(aiReport, rowType, rowId);
    if (!rowData) return NextResponse.json({ error: "Row not found" }, { status: 404 });

    // Cache check
    if (rowData.actionDetail && typeof rowData.actionDetail === "string") {
      return NextResponse.json({ actionDetail: rowData.actionDetail });
    }

    const siteUrl = property?.url ?? report.propertyId;
    const dateRangeStart = report.dateRangeStart;
    const dateRangeEnd = report.dateRangeEnd;

    const systemPrompt = `You are an SEO expert generating a personalized action detail for a specific issue found on ${siteUrl}.

The report covers ${dateRangeStart} to ${dateRangeEnd}.

Issue type: ${rowType}
Issue data: ${JSON.stringify(rowData, null, 2)}

Rules:
- Use actual URLs from the issue data. Do not fabricate URLs.
- Write fix steps for a non-technical site owner. Be concrete, not generic.
- Do not give generic SEO advice. Every sentence must reference this specific site or issue.
- affectedUrls: list only URLs present in the issue data (pages, targetLandingPage, etc.)
- fixSteps: 3–5 numbered steps, imperative voice, ≤30 words each
- whyItMatters: 1–2 sentences referencing the actual metric values in the issue data`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: systemPrompt }],
      temperature: supportsTemperature(MODEL) ? 0.2 : undefined,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "action_detail",
          schema: detailSchema,
          strict: true,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "No response from AI" }, { status: 500 });

    const rawUsage = response.usage;
    const usageSnapshot: AiUsageSnapshot = {
      inputTokens: rawUsage?.prompt_tokens,
      outputTokens: rawUsage?.completion_tokens,
      totalTokens: rawUsage?.total_tokens,
      cachedInputTokens: rawUsage?.prompt_tokens_details?.cached_tokens,
    };
    const callCost = estimateOpenAICostUsd(MODEL, usageSnapshot);
    const detail = JSON.parse(content) as {
      affectedUrls: string[];
      fixSteps: string[];
      whyItMatters: string;
    };
    const serializedDetail = JSON.stringify(detail);

    let saved = false;
    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt += 1) {
      const latestReport = attempt === 0
        ? report
        : await db.query.reports.findFirst({
            where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
          });
      if (!latestReport) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      const latestAiReport = latestReport.aiReportJson as AiSeoReport | null;
      if (!latestAiReport) {
        return NextResponse.json({ error: "No AI report data" }, { status: 404 });
      }

      const latestRowData = findRow(latestAiReport, rowType, rowId);
      if (!latestRowData) {
        return NextResponse.json({ error: "Row not found" }, { status: 404 });
      }

      const patched = patchRowActionDetail(latestAiReport, rowType, rowId, serializedDetail);
      const newDetailsCostUsd = computeNextDetailsCostUsd(latestReport.detailsCostUsd, callCost);

      const updated = await db
        .update(reports)
        .set({
          aiReportJson: patched,
          updatedAt: new Date(),
          ...(newDetailsCostUsd != null && { detailsCostUsd: newDetailsCostUsd }),
        })
        .where(and(eq(reports.id, reportId), eq(reports.updatedAt, latestReport.updatedAt)))
        .returning({ id: reports.id });

      if (updated.length > 0) {
        saved = true;
        break;
      }
    }

    if (!saved) {
      return NextResponse.json(
        { error: "Could not save detail due to concurrent updates. Please retry." },
        { status: 409 }
      );
    }

    return NextResponse.json({ actionDetail: serializedDetail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[generate-detail] 500:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: reportId } = await params;
    const { searchParams } = new URL(req.url);
    const rowTypeValue = searchParams.get("rowType");
    const rowId = searchParams.get("rowId");

    if (!rowTypeValue || !rowId) {
      return NextResponse.json({ error: "rowType and rowId are required" }, { status: 400 });
    }
    if (!isRowType(rowTypeValue)) {
      return NextResponse.json({ error: "Invalid rowType" }, { status: 400 });
    }
    const rowType = rowTypeValue;

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    const teamIds = userTeams.map((row) => row.teamId);
    if (!teamIds.length) return NextResponse.json({ error: "No team found" }, { status: 400 });

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const aiReport = report.aiReportJson as AiSeoReport | null;
    if (!aiReport) return NextResponse.json({ error: "No AI report data" }, { status: 404 });

    const rowData = findRow(aiReport, rowType, rowId);
    if (!rowData) return NextResponse.json({ error: "Row not found" }, { status: 404 });

    const actionDetail =
      typeof rowData.actionDetail === "string" && rowData.actionDetail.length > 0
        ? rowData.actionDetail
        : null;

    return NextResponse.json(
      { actionDetail, ready: actionDetail != null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[generate-detail][GET] 500:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
