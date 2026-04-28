import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { user, teamMembers, teams, properties, session, planSettings } from "@webhealth/shared/db/schema";
import { eq, count, max } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { mapAdminUsers } from "./route.logic";

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

    // Fetch last sign-in per user (max session.createdAt)
    const lastSignIns = await db
      .select({ userId: session.userId, lastSignedInAt: max(session.createdAt) })
      .from(session)
      .groupBy(session.userId);
    const lastSignInMap = new Map(lastSignIns.map((s) => [s.userId, s.lastSignedInAt]));

    // Fetch all plan settings for limit display
    const allPlanSettings = await db.select().from(planSettings);
    const planSettingsMap = new Map(allPlanSettings.map((p) => [p.tier, p]));

    const result = mapAdminUsers({
      users,
      lastSignInByUserId: lastSignInMap,
      planSettingsByTier: planSettingsMap,
    });

    return NextResponse.json({ users: result });
  } catch (error: unknown) {
    return handleRouteError("Error fetching admin users", error);
  }
}
