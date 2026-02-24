import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, teamMembers, teams, properties, reports } from "@/db/schema";
import { eq, count, max } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
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
      .groupBy(user.id, user.name, user.email, user.image, user.createdAt, teams.id, teams.name, teams.tier)
      .orderBy(user.createdAt);

    // Fetch report counts separately
    const reportCounts = await db
      .select({
        teamId: reports.teamId,
        reportsCount: count(reports.id),
      })
      .from(reports)
      .groupBy(reports.teamId);

    const reportCountMap = new Map(reportCounts.map((r) => [r.teamId, r.reportsCount]));

    const result = users.map((u) => ({
      ...u,
      reportsCount: u.teamId ? (reportCountMap.get(u.teamId) ?? 0) : 0,
    }));

    return NextResponse.json({ users: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
