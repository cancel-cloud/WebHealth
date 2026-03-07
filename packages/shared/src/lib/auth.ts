import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@webhealth/shared/db";
import * as schema from "@webhealth/shared/db/schema";
import { teams, teamMembers, systemLogs } from "@webhealth/shared/db/schema";
import { nanoid } from "nanoid";
import { syncPropertiesForUser } from "@webhealth/shared/lib/sync-properties";
import { updateGoogleAccountTokens } from "@webhealth/shared/lib/provider-tokens";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // Must pass schema directly so Better Auth can locate tables by model name
    // (e.g. "verification", "session", "account", "user")
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
      ],
    },
  },
  // Trust the configured base URL and localhost for dev
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    "http://localhost:3000",
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create Solo team on first sign-in
          const teamId = `solo_${user.id}`;
          await db.insert(teams).values({
            id: teamId,
            name: `${user.name}'s Workspace`,
            ownerId: user.id,
            tier: "free",
          });
          await db.insert(teamMembers).values({
            id: `tm_${nanoid(8)}_${user.id}`,
            teamId,
            userId: user.id,
            role: "owner",
          });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // Auto-sync properties on first Google login (account.create only fires once per provider)
          if (account.providerId !== "google" || !account.accessToken) return;
          await updateGoogleAccountTokens(account.userId, {
            accessToken: account.accessToken,
            refreshToken: account.refreshToken ?? null,
            idToken: account.idToken ?? null,
          });
          const userTeams = await db.query.teamMembers.findMany({
            where: (tm, { eq }) => eq(tm.userId, account.userId),
          });
          if (userTeams.length === 0) return;
          syncPropertiesForUser({
            userId: account.userId,
            teamId: userTeams[0].teamId,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken ?? undefined,
          }).catch(() => {});
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          db.insert(systemLogs).values({
            id: `log_${nanoid(12)}`,
            action: "user_signin",
            triggeredBy: session.userId,
            targetUserId: session.userId,
            status: "success",
            details: {
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            },
          }).catch(() => {});
        },
      },
    },
  },
});
