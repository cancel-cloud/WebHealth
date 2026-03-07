import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { user, teamMembers, teams, properties, reports, session, planSettings } from "@webhealth/shared/db/schema";
import { eq, count, max, gte } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    await requireAdminSession();

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        isRestricted: user.isRestricted,
        restrictionMessage: user.restrictionMessage,
        teamId: teams.id,
        teamName: teams.name,
        tier: teams.tier,
        propertiesCount: count(properties.id),
        lastSyncedAt: max(properties.lastSyncedAt),
      })
      .from(user)
      .leftJoin(teamMembers, eq(teamMembers.userId, user.id))
      .leftJoin(teams, eq(teams.id, teamMembers.teamId))
      .leftJoin(properties, eq(properties.teamId, teams.id))
      .groupBy(
        user.id,
        user.name,
        user.email,
        user.image,
        user.createdAt,
        user.isRestricted,
        user.restrictionMessage,
        teams.id,
        teams.name,
        teams.tier,
      )
      .orderBy(user.createdAt);

    // Fetch all-time report counts per team
    const reportCounts = await db
      .select({ teamId: reports.teamId, reportsCount: count(reports.id) })
      .from(reports)
      .groupBy(reports.teamId);
    const reportCountMap = new Map(reportCounts.map((r) => [r.teamId, r.reportsCount]));

    // Fetch reports in last 30 days per team
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reportsRecent = await db
      .select({ teamId: reports.teamId, count: count(reports.id) })
      .from(reports)
      .where(gte(reports.createdAt, thirtyDaysAgo))
      .groupBy(reports.teamId);
    const reportsRecentMap = new Map(reportsRecent.map((r) => [r.teamId, r.count]));

    // Fetch last sign-in per user (max session.createdAt)
    const lastSignIns = await db
      .select({ userId: session.userId, lastSignedInAt: max(session.createdAt) })
      .from(session)
      .groupBy(session.userId);
    const lastSignInMap = new Map(lastSignIns.map((s) => [s.userId, s.lastSignedInAt]));

    // Fetch all plan settings for limit display
    const allPlanSettings = await db.select().from(planSettings);
    const planSettingsMap = new Map(allPlanSettings.map((p) => [p.tier, p]));

    const result = users.map((u) => ({
      ...u,
      reportsCount: u.teamId ? (reportCountMap.get(u.teamId) ?? 0) : 0,
      reportsLast30Days: u.teamId ? (reportsRecentMap.get(u.teamId) ?? 0) : 0,
      lastSignedInAt: lastSignInMap.get(u.id) ?? null,
      planLimits: u.tier ? (planSettingsMap.get(u.tier) ?? null) : null,
    }));

    return NextResponse.json({ users: result });
  } catch (error: unknown) {
    return handleRouteError("Error fetching admin users", error);
  }
}
