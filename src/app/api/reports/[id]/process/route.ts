import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, crawls, systemLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { crawlWebsite } from '@/lib/crawl';
import { getGoogleAuthClient, fetchGscMetrics, fetchGa4Metrics, fetchGa4ReportProfile } from '@/lib/google/api';
import { generateQuickWins } from '@/lib/openai';
import { isEnabled } from '@/lib/feature-flags';
import { composeReportMetricsFromCache, ensureMetricsCoverageForReport } from '@/lib/metrics-cache';

// POST /api/reports/[id]/process — internal route to process a queued report
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  let logUserId: string | undefined;

  try {
    // Mark as processing
    await db.update(reports).set({ status: 'processing' }).where(eq(reports.id, reportId));

    const report = await db.query.reports.findFirst({
      where: (r, { eq }) => eq(r.id, reportId),
    });

    if (!report) {
      await db.update(reports).set({ status: 'failed' }).where(eq(reports.id, reportId));
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch the associated property
    const property = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, report.propertyId),
    });
    if (!property) throw new Error('Property not found');

    // Get the team owner's Google account for API access
    const teamOwner = await db.query.teamMembers.findFirst({
      where: (tm, { and, eq }) =>
        and(eq(tm.teamId, report.teamId), eq(tm.role, 'owner')),
    });
    if (!teamOwner) throw new Error('No team owner found');
    logUserId = teamOwner.userId;

    const googleAccounts = await db.query.account.findMany({
      where: (a, { eq }) => eq(a.userId, teamOwner.userId),
    });
    const googleAccount = googleAccounts.find((a) => a.providerId === 'google');
    if (!googleAccount?.accessToken) throw new Error('Google account not linked');

    const authClient = getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken ?? undefined
    );

    await ensureMetricsCoverageForReport({
      teamId: report.teamId,
      triggeredByUserId: teamOwner.userId,
      property,
      dateRangeStart: String(report.dateRangeStart),
      dateRangeEnd: String(report.dateRangeEnd),
      compareRangeStart: String(report.compareRangeStart),
      compareRangeEnd: String(report.compareRangeEnd),
      authClient,
      refreshRecentDays: 7,
    });

    // 1. Crawl the website (if enabled for this team owner)
    const crawlingEnabled = await isEnabled('crawling_enabled', teamOwner.userId);
    let crawlData: Awaited<ReturnType<typeof crawlWebsite>> | null = null;

    if (crawlingEnabled) {
      const crawlId = `crawl_${Date.now()}`;
      await db.insert(crawls).values({
        id: crawlId,
        reportId,
        propertyId: report.propertyId,
        status: 'running',
      });

      crawlData = await crawlWebsite(property.url, 50);

      await db
        .update(crawls)
        .set({ status: 'complete', data: crawlData, pagesCrawled: crawlData.pages.length })
        .where(eq(crawls.id, crawlId));
    }

    // 2. Prefer composing metrics from cache; fall back to live fetch if cache is incomplete.
    const cachedMetrics = await composeReportMetricsFromCache({
      property,
      dateRangeStart: String(report.dateRangeStart),
      dateRangeEnd: String(report.dateRangeEnd),
      compareRangeStart: String(report.compareRangeStart),
      compareRangeEnd: String(report.compareRangeEnd),
      refreshRecentDays: 7,
    });

    const [gscCurrent, gscCompare, ga4CurrentBase, ga4CompareBase] = cachedMetrics
      ? [
          cachedMetrics.gsc.current,
          cachedMetrics.gsc.compare,
          cachedMetrics.ga4.current,
          cachedMetrics.ga4.compare,
        ]
      : await (async () => {
          const [liveGscCurrent, liveGscCompare] = await Promise.all([
            fetchGscMetrics(authClient, property.url, report.dateRangeStart, report.dateRangeEnd),
            fetchGscMetrics(authClient, property.url, report.compareRangeStart, report.compareRangeEnd),
          ]);

          const [liveGa4Current, liveGa4Compare] = property.ga4PropertyId
            ? await Promise.all([
                fetchGa4Metrics(authClient, property.ga4PropertyId, report.dateRangeStart, report.dateRangeEnd),
                fetchGa4Metrics(authClient, property.ga4PropertyId, report.compareRangeStart, report.compareRangeEnd),
              ])
            : [null, null];

          return [liveGscCurrent, liveGscCompare, liveGa4Current, liveGa4Compare] as const;
        })();

    // 3. Fetch rich GA4 dimensional profile (2 batchRunReports calls)
    let ga4Current = ga4CurrentBase as any;
    let ga4Compare = ga4CompareBase as any;

    if (property.ga4PropertyId) {
      try {
        const ga4Profile = await fetchGa4ReportProfile(
          authClient,
          property.ga4PropertyId,
          String(report.dateRangeStart),
          String(report.dateRangeEnd),
          String(report.compareRangeStart),
          String(report.compareRangeEnd),
        );
        // Merge rich profile into base summary metrics (guard against null base)
        ga4Current = { ...(ga4CurrentBase ?? {}), ...ga4Profile.current };
        ga4Compare = { ...(ga4CompareBase ?? {}), ...ga4Profile.compare };
      } catch {
        // Profile fetch failure is non-fatal — fall back to summary-only
      }
    }

    const reportData = {
      gsc: { current: gscCurrent, compare: gscCompare },
      ga4: { current: ga4Current, compare: ga4Compare },
      crawl: crawlData,
    };

    // 4. AI Quick Wins (if enabled for this team owner)
    const aiEnabled = await isEnabled('ai_quick_wins_enabled', teamOwner.userId);
    const quickWins = aiEnabled ? await generateQuickWins(reportData) : null;

    // 5. Mark as complete
    await db
      .update(reports)
      .set({ status: 'complete', data: reportData, quickWins })
      .where(eq(reports.id, reportId));

    if (logUserId) {
      db.insert(systemLogs).values({
        id: `log_${nanoid(12)}`,
        action: 'report_process',
        triggeredBy: logUserId,
        targetUserId: logUserId,
        status: 'success',
        details: { reportId },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error(`Error processing report ${reportId}:`, error);
    await db.update(reports).set({ status: 'failed' }).where(eq(reports.id, reportId));

    if (logUserId) {
      db.insert(systemLogs).values({
        id: `log_${nanoid(12)}`,
        action: 'report_process',
        triggeredBy: logUserId,
        targetUserId: logUserId,
        status: 'failed',
        details: { reportId, error: message },
      }).catch(() => {});
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
