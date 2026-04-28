import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { feedbackSubmissions, teams } from "@webhealth/shared/db/schema";
import { formatPlanName } from "@/lib/plan-label";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { parseAdminFeedbackQuery } from "./route.logic";

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const query = parseAdminFeedbackQuery(searchParams);
    const conditions = [];

    if (query.status !== "all") {
      conditions.push(eq(feedbackSubmissions.status, query.status));
    }

    if (query.q) {
      conditions.push(
        or(
          ilike(feedbackSubmissions.message, `%${query.q}%`),
          ilike(feedbackSubmissions.userNameSnapshot, `%${query.q}%`),
          ilike(feedbackSubmissions.emailSnapshot, `%${query.q}%`),
        ),
      );
    }

    const rows = await db
      .select({
        id: feedbackSubmissions.id,
        teamId: feedbackSubmissions.teamId,
        userId: feedbackSubmissions.userId,
        userName: feedbackSubmissions.userNameSnapshot,
        email: feedbackSubmissions.emailSnapshot,
        type: feedbackSubmissions.type,
        source: feedbackSubmissions.source,
        message: feedbackSubmissions.message,
        status: feedbackSubmissions.status,
        createdAt: feedbackSubmissions.createdAt,
        resolvedAt: feedbackSubmissions.resolvedAt,
      })
      .from(feedbackSubmissions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(feedbackSubmissions.createdAt))
      .limit(query.limit + 1)
      .offset(query.offset);

    const hasNext = rows.length > query.limit;
    const pageRows = hasNext ? rows.slice(0, query.limit) : rows;
    const teamIds = [...new Set(pageRows.map((row) => row.teamId).filter((value): value is string => Boolean(value)))];

    const teamRows = teamIds.length
      ? await db
          .select({ id: teams.id, tier: teams.tier })
          .from(teams)
          .where(inArray(teams.id, teamIds))
      : [];

    const teamMap = new Map(teamRows.map((row) => [row.id, row]));

    const submissions = pageRows.map((row) => {
      const team = row.teamId ? teamMap.get(row.teamId) : null;

      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
        planLabel: team?.tier ? formatPlanName(team.tier) : null,
      };
    });

    return NextResponse.json({
      submissions,
      pagination: {
        page: query.page,
        limit: query.limit,
        hasNext,
      },
    });
  } catch (error: unknown) {
    return handleRouteError("GET /api/admin/feedback error", error);
  }
}
