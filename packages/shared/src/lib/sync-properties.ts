import { db } from "@webhealth/shared/db";
import { properties, systemLogs } from "@webhealth/shared/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  getGoogleAuthClient,
  fetchGscProperties,
  fetchGa4Properties,
  fetchGscDataStartDate,
} from "@webhealth/shared/lib/google/api";
import { updateGoogleAccountTokens } from "@webhealth/shared/lib/provider-tokens";

export async function syncPropertiesForUser({
  userId,
  teamId,
  accessToken,
  refreshToken,
  accessTokenExpiresAt,
}: {
  userId: string;
  teamId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date | null;
}): Promise<{
  gscCount: number;
  ga4Count: number;
  discoveredGscCount: number;
  discoveredGa4Count: number;
  autoLinked: number;
}> {
  const authClient = getGoogleAuthClient(accessToken, refreshToken, accessTokenExpiresAt);

  authClient.on("tokens", (tokens) => {
    if (tokens.access_token) {
      updateGoogleAccountTokens(userId, {
        accessToken: tokens.access_token,
        ...(tokens.expiry_date
          ? { accessTokenExpiresAt: new Date(tokens.expiry_date) }
          : {}),
      }).catch(() => {});
    }
  });

  let gscSites: Awaited<ReturnType<typeof fetchGscProperties>>;
  let ga4Props: Awaited<ReturnType<typeof fetchGa4Properties>>;
  try {
    [gscSites, ga4Props] = await Promise.all([
      fetchGscProperties(authClient),
      fetchGa4Properties(authClient),
    ]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (
      msg.includes("invalid_grant") ||
      msg.includes("Invalid Credentials") ||
      msg.includes("invalid_credentials")
    ) {
      const authErr = new Error("Google authorization expired. Please sign in again.");
      (authErr as any).code = "GOOGLE_AUTH_RELOGIN_REQUIRED";
      throw authErr;
    }
    throw error;
  }

  const discoveredGscCount = gscSites.filter((site) => !!site.siteUrl).length;
  const discoveredGa4Count = ga4Props.length;

  // --- Store GSC properties ---
  let gscCount = 0;
  const gscToInsert: (typeof properties.$inferInsert)[] = [];
  for (const site of gscSites) {
    if (!site.siteUrl) continue;
    const propertyId = `gsc_${site.siteUrl}`;
    const existing = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, propertyId),
    });
    if (!existing) {
      gscToInsert.push({
        id: propertyId,
        teamId,
        type: "gsc",
        name: site.siteUrl.replace("sc-domain:", "").replace("https://", "").replace(/\/$/, ""),
        url: site.siteUrl,
        syncStatus: "complete",
        lastSyncedAt: new Date(),
      });
      gscCount++;
    }
  }
  if (gscToInsert.length > 0) {
    await db.insert(properties).values(gscToInsert);
  }

  // --- Store GA4 properties ---
  let ga4Count = 0;
  const ga4ToInsert: (typeof properties.$inferInsert)[] = [];
  for (const ga4 of ga4Props) {
    const propertyId = `ga4_${ga4.propertyId}`;
    const existing = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, propertyId),
    });
    if (!existing) {
      ga4ToInsert.push({
        id: propertyId,
        teamId,
        type: "ga4",
        name: ga4.displayName,
        url: ga4.displayName,
        syncStatus: "complete",
        lastSyncedAt: new Date(),
      });
      ga4Count++;
    }
  }
  if (ga4ToInsert.length > 0) {
    await db.insert(properties).values(ga4ToInsert);
  }

  // --- Probe GSC data start date for unprobed properties ---
  const unprobedGsc = await db.query.properties.findMany({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.teamId, teamId), eq(p.type, "gsc"), isNull(p.gscDataStartDate)),
  });
  if (unprobedGsc.length > 0) {
    await Promise.all(
      unprobedGsc.map(async (prop) => {
        try {
          const startDate = await fetchGscDataStartDate(authClient, prop.url);
          if (startDate) {
            await db
              .update(properties)
              .set({ gscDataStartDate: startDate })
              .where(eq(properties.id, prop.id));
          }
        } catch {
          // Non-fatal
        }
      })
    );
  }

  // --- Auto-match GSC → GA4 by domain ---
  let autoLinked = 0;
  const unlinkedGsc = await db.query.properties.findMany({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.teamId, teamId), eq(p.type, "gsc"), isNull(p.ga4PropertyId)),
  });
  for (const gscProp of unlinkedGsc) {
    const domain = gscProp.url
      .replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "")
      .toLowerCase();
    const match = ga4Props.find(
      (ga4) =>
        ga4.displayName.toLowerCase().includes(domain) ||
        domain.includes(ga4.displayName.toLowerCase().replace(/^www\./, ""))
    );
    if (match) {
      await db
        .update(properties)
        .set({ ga4PropertyId: match.propertyId })
        .where(eq(properties.id, gscProp.id));
      autoLinked++;
    }
  }

  db.insert(systemLogs)
    .values({
      id: `log_${nanoid(12)}`,
      action: "property_sync",
      triggeredBy: userId,
      targetUserId: userId,
      status: "success",
      details: {
        gscCount,
        ga4Count,
        discoveredGscCount,
        discoveredGa4Count,
        autoLinked,
      },
    })
    .catch(() => {});

  return {
    gscCount,
    ga4Count,
    discoveredGscCount,
    discoveredGa4Count,
    autoLinked,
  };
}
