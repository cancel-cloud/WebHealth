import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { userSettings } from "@webhealth/shared/db/schema";
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { listAdminEmails } from "@webhealth/shared/lib/admin-access";
import { DEFAULT_SUPPORTED_LANGUAGE } from "@webhealth/shared/lib/language";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireSession, getUserTeamMemberships } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { normalizeSettingsPatch } from "./route.logic";

const DEFAULT_SETTINGS = {
  weeklyDigest: true,
  syncFailure: true,
  emailReceipts: true,
  preferredLanguage: DEFAULT_SUPPORTED_LANGUAGE,
};

// GET /api/settings — fetch the current user's settings
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
    };

    if (existing) {
      const { weeklyDigest, syncFailure, emailReceipts, preferredLanguage } = existing;
      return NextResponse.json({ weeklyDigest, syncFailure, emailReceipts, preferredLanguage, ...baseResponse });
    }

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...baseResponse });
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
    const { patch, hasChanges } = normalizeSettingsPatch(body);

    if (!hasChanges) {
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

    const { weeklyDigest, syncFailure, emailReceipts, preferredLanguage } = updated;
    return NextResponse.json({ weeklyDigest, syncFailure, emailReceipts, preferredLanguage });
  } catch (error: unknown) {
    return handleRouteError("PATCH /api/settings error", error);
  }
}
