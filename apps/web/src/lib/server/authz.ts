import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { teamMembers, user } from "@webhealth/shared/db/schema";
import {
  forbidden,
  notFound,
  unauthorized,
} from "@webhealth/shared/lib/http-errors";
import { isAdminEmail } from "@webhealth/shared/lib/admin-access";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }
  return session;
}

export async function requireUnrestrictedSession() {
  const session = await requireSession();
  await assertUserNotRestricted(session.user.id);
  return session;
}

export async function assertUserNotRestricted(userId: string) {
  const userRecord = await db.query.user.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    columns: { isRestricted: true },
  });

  if (userRecord?.isRestricted) {
    throw forbidden("Your account is restricted. Contact an administrator from the Settings page.", "ACCOUNT_RESTRICTED");
  }
}

export async function getUserTeamMemberships(userId: string) {
  return db.query.teamMembers.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
  });
}

export async function requireAnyTeamMembership(session: Session) {
  const memberships = await getUserTeamMemberships(session.user.id);
  if (!memberships.length) {
    throw notFound("No team found", "TEAM_NOT_FOUND");
  }
  return memberships;
}

export async function requirePrimaryTeamMembership(session: Session) {
  const memberships = await requireAnyTeamMembership(session);
  // TODO(team-authz): Current product behavior assumes one effective team per user.
  // When real multi-team support is added, replace this with target-resource team resolution.
  return memberships[0];
}

export async function requireTeamOwner(session: Session) {
  const membership = await requirePrimaryTeamMembership(session);
  // TODO(team-authz): Current product behavior assumes one effective team per user.
  // When real multi-team support is added, owner checks must resolve against the target resource team.
  if (membership.role !== "owner") {
    throw forbidden("Only team owners can perform this action", "OWNER_REQUIRED");
  }
  return membership;
}

export async function requireAdminSession() {
  const session = await requireUnrestrictedSession();
  const allowed = await isAdminEmail(session.user.email ?? null);
  if (!allowed) {
    throw forbidden();
  }
  return session;
}
