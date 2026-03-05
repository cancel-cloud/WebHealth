import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import OpenAI from "openai";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
  organization: process.env.OPENAI_ORG ?? undefined,
  project: process.env.OPENAI_PROJECT ?? undefined,
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

type RowType =
  | "actionBacklog"
  | "ctrGap"
  | "nearWin"
  | "cannibalization"
  | "contentDecay";

type ActionDetail = {
  affectedUrls: string[];
  fixSteps: string[];
  whyItMatters: string;
};

const rowTypeToArrayKey: Record<RowType, keyof AiSeoReport> = {
  actionBacklog: "actionBacklogRows",
  ctrGap: "lostClickEstimateRows",
  nearWin: "nearWinKeywordRows",
  cannibalization: "cannibalizationRows",
  contentDecay: "contentDecayRows",
};

const rowTypeToIdField: Record<RowType, string> = {
  actionBacklog: "id",
  ctrGap: "query",
  nearWin: "keyword",
  cannibalization: "query",
  contentDecay: "page",
};

function findRow(
  aiReport: AiSeoReport,
  rowType: RowType,
  rowId: string
): Record<string, unknown> | null {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey] as Record<string, unknown>[] | null | undefined;
  if (!rows) return null;
  return rows.find((r) => r[idField] === rowId) ?? null;
}

function patchRowActionDetail(
  aiReport: AiSeoReport,
  rowType: RowType,
  rowId: string,
  actionDetail: string
): AiSeoReport {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey] as Record<string, unknown>[] | null | undefined;
  if (!rows) return aiReport;

  const patched = rows.map((r) =>
    r[idField] === rowId ? { ...r, actionDetail } : r
  );

  return { ...aiReport, [arrayKey]: patched };
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
    const { rowType, rowId } = body;

    if (!rowType || !rowId) {
      return NextResponse.json({ error: "rowType and rowId are required" }, { status: 400 });
    }
    if (!Object.keys(rowTypeToArrayKey).includes(rowType)) {
      return NextResponse.json({ error: "Invalid rowType" }, { status: 400 });
    }

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

    const rowData = findRow(aiReport, rowType as RowType, rowId);
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
      temperature: 0.2,
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

    const detail = JSON.parse(content) as ActionDetail;
    const serializedDetail = JSON.stringify(detail);

    const patched = patchRowActionDetail(aiReport, rowType as RowType, rowId, serializedDetail);
    await db.update(reports)
      .set({ aiReportJson: patched, updatedAt: new Date() })
      .where(eq(reports.id, reportId));

    return NextResponse.json({ actionDetail: serializedDetail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
