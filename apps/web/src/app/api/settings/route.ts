import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { userSettings, reports, planSettings, teamUsage } from "@webhealth/shared/db/schema";
import { eq, and, gte, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { listAdminEmails } from "@webhealth/shared/lib/admin-access";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireSession, getUserTeamMemberships } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

const ALLOWED_FIELDS = ['weeklyDigest', 'reportComplete', 'syncFailure', 'emailReceipts', 'reportLanguage'] as const;

// GET /api/settings — fetch (or upsert defaults for) the current user's settings
export async function GET() {
  try {
    const session = await requireSession();

    const userId = session.user.id;
    const [adminContacts, userRecord, memberships] = await Promise.all([
      listAdminEmails(),
      db.query.user.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
        columns: { isRestricted: true, restrictionMessage: true },
      }),
      getUserTeamMemberships(userId),
    ]);

    // Resolve the user's primary team tier
    const primaryTeamId = memberships[0]?.teamId ?? null;
    const team = primaryTeamId
      ? await db.query.teams.findFirst({
          where: (t, { eq }) => eq(t.id, primaryTeamId),
          columns: { tier: true, stripeCustomerId: true, subscriptionCancelAt: true },
        })
      : null;
    const teamTier = team?.tier ?? "free";
    const hasStripeCustomer = Boolean(team?.stripeCustomerId);
    const subscriptionCancelAt = team?.subscriptionCancelAt?.toISOString() ?? null;

    // Usage data for the current month
    const yearMonth = new Date().toISOString().slice(0, 7);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [planRecord, usageRecord, reportsThisMonthResult] = primaryTeamId
      ? await Promise.all([
          db.query.planSettings.findFirst({
            where: (ps, { eq }) => eq(ps.tier, teamTier),
            columns: { reportsPerMonth: true, detailsPerMonth: true },
          }),
          db.query.teamUsage.findFirst({
            where: (u, { and, eq }) => and(eq(u.teamId, primaryTeamId), eq(u.yearMonth, yearMonth)),
            columns: { detailsCount: true },
          }),
          db.select({ count: count() }).from(reports).where(
            and(eq(reports.teamId, primaryTeamId), gte(reports.createdAt, monthStart))
          ),
        ])
      : [null, null, [{ count: 0 }]];

    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    const baseResponse = {
      isRestricted: Boolean(userRecord?.isRestricted),
      restrictionMessage: userRecord?.restrictionMessage ?? null,
      adminContacts: adminContacts.map((row) => row.email),
      teamTier,
      hasStripeCustomer,
      subscriptionCancelAt,
      reportsThisMonth: Number(reportsThisMonthResult[0]?.count ?? 0),
      reportsLimit: planRecord?.reportsPerMonth ?? null,
      detailsThisMonth: usageRecord?.detailsCount ?? 0,
      detailsLimit: planRecord?.detailsPerMonth ?? null,
    };

    if (existing) {
      const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = existing;
      return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage, ...baseResponse });
    }

    // No row yet — upsert defaults and return them
    const [created] = await db
      .insert(userSettings)
      .values({ id: nanoid(), userId })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { updatedAt: new Date() },
      })
      .returning();

    const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = created;
    return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage, ...baseResponse });
  } catch (error: unknown) {
    return handleRouteError("GET /api/settings error", error);
  }
}

// PATCH /api/settings — upsert partial settings update for the current user
export async function PATCH(req: Request) {
  try {
    const session = await requireSession();

    const userId = session.user.id;
    const body = await req.json();

    // Only pick allowed fields from the request body
    const patch: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field === 'reportLanguage') {
        if (typeof body[field] === 'string' && body[field].trim()) {
          patch[field] = body[field].trim().toLowerCase();
        }
      } else if (typeof body[field] === 'boolean') {
        patch[field] = body[field];
      }
    }

    if (Object.keys(patch).length === 0) {
      throw badRequest("NO_VALID_SETTINGS_FIELDS", "No valid fields provided");
    }

    const [updated] = await db
      .insert(userSettings)
      .values({ id: nanoid(), userId, ...patch })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = updated;
    return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage });
  } catch (error: unknown) {
    return handleRouteError("PATCH /api/settings error", error);
  }
}
