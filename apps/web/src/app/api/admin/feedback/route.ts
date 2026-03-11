import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, ilike, inArray, or } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { feedbackSubmissions, planSettings, reports, teamUsage, teams } from "@webhealth/shared/db/schema";
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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearMonth = now.toISOString().slice(0, 7);

    const [teamRows, reportCountRows, reportMonthRows, usageRows, settingsRows] = await Promise.all([
      teamIds.length
        ? db
            .select({ id: teams.id, tier: teams.tier })
            .from(teams)
            .where(inArray(teams.id, teamIds))
        : Promise.resolve([]),
      teamIds.length
        ? db
            .select({ teamId: reports.teamId, reportsCount: count(reports.id) })
            .from(reports)
            .where(inArray(reports.teamId, teamIds))
            .groupBy(reports.teamId)
        : Promise.resolve([]),
      teamIds.length
        ? db
            .select({ teamId: reports.teamId, reportsThisMonth: count(reports.id) })
            .from(reports)
            .where(and(inArray(reports.teamId, teamIds), gte(reports.createdAt, monthStart)))
            .groupBy(reports.teamId)
        : Promise.resolve([]),
      teamIds.length
        ? db
            .select({ teamId: teamUsage.teamId, detailsThisMonth: teamUsage.detailsCount })
            .from(teamUsage)
            .where(and(inArray(teamUsage.teamId, teamIds), eq(teamUsage.yearMonth, yearMonth)))
        : Promise.resolve([]),
      db.select().from(planSettings),
    ]);

    const teamMap = new Map(teamRows.map((row) => [row.id, row]));
    const reportCountMap = new Map(reportCountRows.map((row) => [row.teamId, row.reportsCount]));
    const reportMonthMap = new Map(reportMonthRows.map((row) => [row.teamId, row.reportsThisMonth]));
    const usageMap = new Map(usageRows.map((row) => [row.teamId, row.detailsThisMonth]));
    const settingsMap = new Map(settingsRows.map((row) => [row.tier, row]));

    const submissions = pageRows.map((row) => {
      const team = row.teamId ? teamMap.get(row.teamId) : null;
      const plan = team?.tier ? settingsMap.get(team.tier) ?? null : null;

      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
        planLabel: team?.tier ? formatPlanName(team.tier) : null,
        reportsCount: row.teamId ? (reportCountMap.get(row.teamId) ?? 0) : 0,
        reportsThisMonth: row.teamId ? (reportMonthMap.get(row.teamId) ?? 0) : 0,
        reportsLimit: plan?.reportsPerMonth ?? null,
        detailsThisMonth: row.teamId ? (usageMap.get(row.teamId) ?? 0) : 0,
        detailsLimit: plan?.detailsPerMonth ?? null,
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
