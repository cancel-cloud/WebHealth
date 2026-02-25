import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, systemLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getGoogleAuthClient,
  fetchGscProperties,
  fetchGa4Properties,
} from "@/lib/google/api";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import {
  createMetricsBackfillJob,
  processMetricsBackfillJob,
} from "@/lib/metrics-cache";

const ADMIN_EMAIL = "lukas@devbrew.dev";
const TIMEFRAME_DAYS = {
  "14d": 14,
  "30d": 30,
  "60d": 60,
} as const;
type TimeframePreset = keyof typeof TIMEFRAME_DAYS;

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      userId,
      includeGsc = true,
      includeGa4 = true,
      timeframe = "30d",
    } = body as {
      userId?: string;
      includeGsc?: boolean;
      includeGa4?: boolean;
      timeframe?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!includeGsc && !includeGa4) {
      return NextResponse.json({ error: "Select at least one source to sync" }, { status: 400 });
    }
    if (!(timeframe in TIMEFRAME_DAYS)) {
      return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
    }
    const timeframePreset = timeframe as TimeframePreset;

    const logId = `log_${nanoid(12)}`;
    await db.insert(systemLogs).values({
      id: logId,
      action: "property_sync",
      triggeredBy: session.user.id,
      targetUserId: userId,
      status: "started",
      details: { mode: "sync_only", includeGsc, includeGa4, timeframe: timeframePreset },
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
      const gscSites: Awaited<ReturnType<typeof fetchGscProperties>> = includeGsc
        ? await fetchGscProperties(authClient)
        : [];
      const ga4Props: Awaited<ReturnType<typeof fetchGa4Properties>> = includeGa4
        ? await fetchGa4Properties(authClient)
        : [];

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

      if (includeGa4) {
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
      }

      // Metrics sync + validation (no report creation): persist daily raw/fact rows for the test window.
      const days = TIMEFRAME_DAYS[timeframePreset];
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - (days - 1));
      const dateStart = start.toISOString().slice(0, 10);
      const dateEnd = end.toISOString().slice(0, 10);

      const metricsJob = await createMetricsBackfillJob({
        teamId: targetTeamId,
        triggeredByUserId: session.user.id,
        targetUserId: userId,
        includeGsc,
        includeGa4,
        dateStart,
        dateEnd,
        reason: "admin_sync",
        timeframeMode: "preset",
        refreshRecentDays: 7,
      });
      const metricsResult = await processMetricsBackfillJob({
        jobId: metricsJob.id,
        authClient,
      });
      const {
        gscValidated,
        gscValidationFailed,
        ga4Validated,
        ga4ValidationFailed,
        gscFetchedDates,
        gscSkippedDates,
        gscRefreshedDates,
        ga4FetchedDates,
        ga4SkippedDates,
        ga4RefreshedDates,
      } = metricsResult.totals;

      await db
        .update(systemLogs)
        .set({
          status: "success",
          details: {
            gscCount,
            ga4Count,
            autoLinked,
            mode: "sync_only",
            includeGsc,
            includeGa4,
            timeframe: timeframePreset,
            dateStart,
            dateEnd,
            metricsJobId: metricsJob.id,
            gscValidated,
            gscValidationFailed,
            ga4Validated,
            ga4ValidationFailed,
            gscFetchedDates,
            gscSkippedDates,
            gscRefreshedDates,
            ga4FetchedDates,
            ga4SkippedDates,
            ga4RefreshedDates,
          },
        })
        .where(eq(systemLogs.id, logId));

      return NextResponse.json({
        success: true,
        gscCount,
        ga4Count,
        autoLinked,
        includeGsc,
        includeGa4,
        timeframe: timeframePreset,
        timeframeLabel:
          timeframePreset === "14d"
            ? "last 2 weeks"
            : timeframePreset === "60d"
              ? "last 2 months"
              : "last month",
        dateStart,
        dateEnd,
        metricsJobId: metricsJob.id,
        gscValidated,
        gscValidationFailed,
        ga4Validated,
        ga4ValidationFailed,
        gscFetchedDates,
        gscSkippedDates,
        gscRefreshedDates,
        ga4FetchedDates,
        ga4SkippedDates,
        ga4RefreshedDates,
        reportsCreated: 0,
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
