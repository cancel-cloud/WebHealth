import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, reports, systemLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getGoogleAuthClient,
  fetchGscProperties,
  fetchGa4Properties,
} from "@/lib/google/api";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, dateStart, dateEnd } = body;

    if (!userId || !dateStart || !dateEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const logId = `log_${nanoid(12)}`;
    await db.insert(systemLogs).values({
      id: logId,
      action: "property_sync",
      triggeredBy: session.user.id,
      targetUserId: userId,
      status: "started",
      details: { dateStart, dateEnd },
    });

    try {
      // Get target user's Google account
      const googleAccount = await db.query.account.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.userId, userId), eq(a.providerId, "google")),
      });

      if (!googleAccount?.accessToken) {
        await db
          .update(systemLogs)
          .set({ status: "failed", details: { error: "Google account not linked" } })
          .where(eq(systemLogs.id, logId));
        return NextResponse.json({ error: "Target user has no Google account linked" }, { status: 400 });
      }

      const authClient = getGoogleAuthClient(
        googleAccount.accessToken,
        googleAccount.refreshToken ?? undefined
      );

      // Get target user's team
      const userTeam = await db.query.teamMembers.findFirst({
        where: (tm, { eq }) => eq(tm.userId, userId),
      });

      if (!userTeam) {
        await db
          .update(systemLogs)
          .set({ status: "failed", details: { error: "No team found for user" } })
          .where(eq(systemLogs.id, logId));
        return NextResponse.json({ error: "No team found for target user" }, { status: 400 });
      }

      const targetTeamId = userTeam.teamId;

      // Fetch & upsert properties
      const [gscSites, ga4Props] = await Promise.all([
        fetchGscProperties(authClient),
        fetchGa4Properties(authClient),
      ]);

      let gscCount = 0;
      for (const site of gscSites) {
        if (!site.siteUrl) continue;
        const propertyId = `gsc_${site.siteUrl}`;
        const existing = await db.query.properties.findFirst({
          where: (p, { eq }) => eq(p.id, propertyId),
        });
        if (!existing) {
          await db.insert(properties).values({
            id: propertyId,
            teamId: targetTeamId,
            type: "gsc",
            name: site.siteUrl.replace("sc-domain:", "").replace("https://", "").replace(/\/$/, ""),
            url: site.siteUrl,
            syncStatus: "complete",
            lastSyncedAt: new Date(),
          });
          gscCount++;
        }
      }

      let ga4Count = 0;
      for (const ga4 of ga4Props) {
        const propertyId = `ga4_${ga4.propertyId}`;
        const existing = await db.query.properties.findFirst({
          where: (p, { eq }) => eq(p.id, propertyId),
        });
        if (!existing) {
          await db.insert(properties).values({
            id: propertyId,
            teamId: targetTeamId,
            type: "ga4",
            name: ga4.displayName,
            url: ga4.displayName,
            syncStatus: "complete",
            lastSyncedAt: new Date(),
          });
          ga4Count++;
        }
      }

      // Auto-match GSC → GA4
      let autoLinked = 0;
      const unlinkedGsc = await db.query.properties.findMany({
        where: (p, { and, eq, isNull }) =>
          and(eq(p.teamId, targetTeamId), eq(p.type, "gsc"), isNull(p.ga4PropertyId)),
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

      // Create reports for each GSC property that has a GA4 link
      const linkedGscProps = await db.query.properties.findMany({
        where: (p, { and, eq, isNotNull }) =>
          and(eq(p.teamId, targetTeamId), eq(p.type, "gsc"), isNotNull(p.ga4PropertyId)),
      });

      const compareEnd = new Date(dateStart);
      compareEnd.setDate(compareEnd.getDate() - 1);
      const dateRange = Math.round(
        (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / (1000 * 60 * 60 * 24)
      );
      const compareStart = new Date(compareEnd);
      compareStart.setDate(compareStart.getDate() - dateRange);

      const compareStartStr = compareStart.toISOString().slice(0, 10);
      const compareEndStr = compareEnd.toISOString().slice(0, 10);

      const createdReports: string[] = [];
      for (const prop of linkedGscProps) {
        const reportId = `rep_${nanoid(12)}`;
        await db.insert(reports).values({
          id: reportId,
          teamId: targetTeamId,
          propertyId: prop.id,
          dateRangeStart: dateStart,
          dateRangeEnd: dateEnd,
          compareRangeStart: compareStartStr,
          compareRangeEnd: compareEndStr,
          status: "queued",
        });
        createdReports.push(reportId);

        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/reports/${reportId}/process`, { method: "POST" }).catch(() => {});
      }

      await db
        .update(systemLogs)
        .set({
          status: "success",
          details: { gscCount, ga4Count, autoLinked, reportsCreated: createdReports.length },
        })
        .where(eq(systemLogs.id, logId));

      return NextResponse.json({
        success: true,
        gscCount,
        ga4Count,
        autoLinked,
        reportsCreated: createdReports.length,
        logId,
      });
    } catch (innerError: unknown) {
      const innerMessage = innerError instanceof Error ? innerError.message : "Unknown error";
      await db
        .update(systemLogs)
        .set({ status: "failed", details: { error: innerMessage } })
        .where(eq(systemLogs.id, logId));
      throw innerError;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in admin sync:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
