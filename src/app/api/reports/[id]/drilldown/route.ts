import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { reports } from "@/db/schema";
import type { DashboardBlock, TableBlock } from "@/lib/reports/dashboard-blocks";

// Simple per-session rate limiting (20 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// GET /api/reports/[id]/drilldown?type=query|page&key=<encoded_key>
// Returns drilldown payload from stored dashboard_blocks_json (no recomputation).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ error: "Rate limit exceeded (20 req/min)" }, { status: 429 });
  }

  const { id: reportId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "query" | "page"
  const key = searchParams.get("key");

  if (!type || !key || (type !== "query" && type !== "page")) {
    return NextResponse.json(
      { error: "Required params: type (query|page) and key" },
      { status: 400 }
    );
  }

  // Resolve team membership
  const userTeams = await db.query.teamMembers.findMany({
    where: (tm, { eq }) => eq(tm.userId, session.user.id),
  });
  const teamIds = userTeams.map((r) => r.teamId);
  if (teamIds.length === 0) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    columns: { id: true, dashboardBlocksJson: true },
  });

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!report.dashboardBlocksJson) {
    return NextResponse.json({ error: "No block data stored for this report" }, { status: 404 });
  }

  const blocks = report.dashboardBlocksJson as DashboardBlock[];

  // Find the relevant table block(s) and look up the drilldown by key
  const targetBlockIds =
    type === "query"
      ? ["query_opportunities", "near_win_keywords"]
      : ["page_winners_losers"];

  for (const block of blocks) {
    if (block.type !== "table") continue;
    const tableBlock = block as TableBlock;
    if (!targetBlockIds.includes(tableBlock.id)) continue;
    const drilldown = tableBlock.details?.[key];
    if (drilldown) {
      return NextResponse.json(drilldown);
    }
  }

  return NextResponse.json(
    { error: "Drilldown not available for this key" },
    { status: 404 }
  );
}
