import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";
import OpenAI from "openai";
import { nanoid } from "nanoid";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reportDetailAiExpansions, reports } from "@webhealth/shared/db/schema";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";
import { estimateOpenAICostUsd } from "@webhealth/shared/lib/openai/cost-estimator";
import { extractOpenAIRequestId } from "@webhealth/shared/lib/openai/request-tracing";
import {
  findRow,
  isRowType,
  makeDetailClientRequestId,
  normalizeDetailUsage,
  patchRowActionDetail,
  shouldGenerateDetail,
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

class DetailSaveConflictError extends Error {}

function extractChatCompletionRequestId(response: unknown): string | null {
  const raw = response as {
    _request_id?: string;
    response?: { headers?: Headers | Record<string, string | string[] | undefined> };
  };
  if (raw._request_id) return raw._request_id;
  if (!raw.response?.headers) return null;
  return extractOpenAIRequestId(raw.response.headers);
}

async function appendDetailExpansionAttempt(input: {
  reportId: string;
  teamId: string;
  requestedByUserId: string;
  requestNumber: number;
  kind: string;
  rowId: string;
  model: string;
  usage: unknown;
  estimatedCostUsd: number | null;
  xRequestId: string | null;
  xClientRequestId: string;
  status: "success" | "failed";
  error: string | null;
}) {
  await db.insert(reportDetailAiExpansions).values({
    id: `rdae_${nanoid(12)}`,
    reportId: input.reportId,
    teamId: input.teamId,
    requestedByUserId: input.requestedByUserId,
    requestNumber: input.requestNumber,
    kind: input.kind,
    rowId: input.rowId,
    model: input.model,
    usage: input.usage as Record<string, unknown> | null,
    estimatedCostUsd: input.estimatedCostUsd != null ? String(input.estimatedCostUsd) : null,
    xRequestId: input.xRequestId,
    xClientRequestId: input.xClientRequestId,
    status: input.status,
    error: input.error,
  });
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
    if (!shouldGenerateDetail(rowData)) {
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

    const [counter] = await db
      .update(reports)
      .set({
        detailsRequestCount: sql`coalesce(${reports.detailsRequestCount}, 0) + 1`,
      })
      .where(eq(reports.id, reportId))
      .returning({ requestNumber: reports.detailsRequestCount });
    if (!counter) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const requestNumber = counter.requestNumber;
    const xClientRequestId = makeDetailClientRequestId({
      reportId,
      requestNumber,
      kind: rowType,
    });

    let usageSnapshot: ReturnType<typeof normalizeDetailUsage> = null;
    let callCost: number | null = null;
    let xRequestId: string | null = null;
    try {
      const response = await openai.chat.completions.create(
        {
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
        },
        {
          headers: { "X-Client-Request-Id": xClientRequestId },
        }
      );

      xRequestId = extractChatCompletionRequestId(response);
      usageSnapshot = normalizeDetailUsage(response.usage ?? null);
      callCost = estimateOpenAICostUsd(MODEL, usageSnapshot);

      if (callCost != null) {
        await db
          .update(reports)
          .set({
            detailsCostUsd: sql`(coalesce(${reports.detailsCostUsd}, 0::numeric) + ${callCost})::numeric(12, 6)`,
          })
          .where(eq(reports.id, reportId));
      }

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      const detail = JSON.parse(content) as {
        affectedUrls: string[];
        fixSteps: string[];
        whyItMatters: string;
      };
      const serializedDetail = JSON.stringify(detail);

      let saved = false;
      for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt += 1) {
        const latestReport =
          attempt === 0
            ? report
            : await db.query.reports.findFirst({
                where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
              });
        if (!latestReport) {
          throw new Error("Report not found");
        }

        const latestAiReport = latestReport.aiReportJson as AiSeoReport | null;
        if (!latestAiReport) {
          throw new Error("No AI report data");
        }

        const latestRowData = findRow(latestAiReport, rowType, rowId);
        if (!latestRowData) {
          throw new Error("Row not found");
        }

        const patched = patchRowActionDetail(latestAiReport, rowType, rowId, serializedDetail);
        const updated = await db
          .update(reports)
          .set({
            aiReportJson: patched,
            updatedAt: new Date(),
          })
          .where(and(eq(reports.id, reportId), eq(reports.updatedAt, latestReport.updatedAt)))
          .returning({ id: reports.id });

        if (updated.length > 0) {
          saved = true;
          break;
        }
      }

      if (!saved) {
        throw new DetailSaveConflictError(
          "Could not save detail due to concurrent updates. Please retry."
        );
      }

      await appendDetailExpansionAttempt({
        reportId,
        teamId: report.teamId,
        requestedByUserId: session.user.id,
        requestNumber,
        kind: rowType,
        rowId,
        model: MODEL,
        usage: usageSnapshot?.raw ?? usageSnapshot,
        estimatedCostUsd: callCost,
        xRequestId,
        xClientRequestId,
        status: "success",
        error: null,
      });

      return NextResponse.json({
        actionDetail: serializedDetail,
        requestNumber,
        kind: rowType,
        estimatedCostUsd: callCost != null ? callCost.toFixed(6) : null,
        xRequestId,
        xClientRequestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      try {
        await appendDetailExpansionAttempt({
          reportId,
          teamId: report.teamId,
          requestedByUserId: session.user.id,
          requestNumber,
          kind: rowType,
          rowId,
          model: MODEL,
          usage: usageSnapshot?.raw ?? usageSnapshot,
          estimatedCostUsd: callCost,
          xRequestId,
          xClientRequestId,
          status: "failed",
          error: message,
        });
      } catch (insertError) {
        console.error("[generate-detail] failed to persist detail expansion audit row", insertError);
      }

      const status = error instanceof DetailSaveConflictError ? 409 : 500;
      return NextResponse.json({ error: message }, { status });
    }
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
