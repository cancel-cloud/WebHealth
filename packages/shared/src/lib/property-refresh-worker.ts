import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { crawlWebsite } from "@webhealth/shared/lib/crawl";
import {
  claimNextPropertyRefreshJob,
  completePropertyRefreshJob,
  failPropertyRefreshJob,
  heartbeatPropertyRefreshJob,
  storePropertyCrawlSnapshot,
  updatePropertyRefreshJobProgress,
  type ClaimedPropertyRefreshJob,
  type PropertyRefreshClaimLane,
} from "@webhealth/shared/lib/property-refresh";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";

async function isRefreshPropertyActive(job: ClaimedPropertyRefreshJob) {
  const property = await db.query.properties.findFirst({
    where: (table, { and, eq: eqFn }) =>
      and(eqFn(table.id, job.propertyId), eqFn(table.teamId, job.teamId), eqFn(table.active, true)),
    columns: { id: true },
  });
  return Boolean(property);
}

async function warmDashboardFromPayload(job: ClaimedPropertyRefreshJob) {
  const payload = (job.payload ?? {}) as Record<string, unknown>;
  const { getLiveDashboardData } = await import("@webhealth/shared/lib/live-dashboard");
  await getLiveDashboardData({
    teamId: job.teamId,
    propertyId: job.propertyId,
    preset: typeof payload.preset === "string" ? payload.preset : null,
    compareMode: typeof payload.compareMode === "string" ? payload.compareMode : null,
    startDate: typeof payload.startDate === "string" ? payload.startDate : null,
    endDate: typeof payload.endDate === "string" ? payload.endDate : null,
  });
}

async function processCrawlRefreshJob(job: ClaimedPropertyRefreshJob) {
  console.log(`[property-refresh][INFO] starting crawl refresh job=${job.id} property=${job.propertyId}`);
  await updatePropertyRefreshJobProgress({
    jobId: job.id,
    phase: "crawl",
      message: job.payload && typeof job.payload === "object" && (job.payload as Record<string, unknown>).triggerSource === "automation"
        ? "Background technical scan refresh running…"
        : "Refreshing technical scan…",
  });

  const resolved = await resolveTeamReportSources(job.teamId, job.propertyId);
  const property = resolved.canonicalGscProperty;
  const crawlData = await crawlWebsite(property.url, 120);

  await storePropertyCrawlSnapshot({
    teamId: job.teamId,
    propertyId: property.id,
    refreshJobId: job.id,
    crawlData,
  });

  await updatePropertyRefreshJobProgress({
    jobId: job.id,
    phase: "analysis",
    message: "Recomputing ranked actions…",
    progressMeta: {
      crawlPages: crawlData.pages.length,
    },
  });

  await warmDashboardFromPayload(job);
  console.log(`[property-refresh][INFO] completed crawl refresh job=${job.id} property=${job.propertyId} pages=${crawlData.pages.length}`);
  await completePropertyRefreshJob(job.id, "Technical refresh complete", {
    crawlPages: crawlData.pages.length,
  });
}

async function processClaimedJob(job: ClaimedPropertyRefreshJob, workerId: string) {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  try {
    heartbeatTimer = setInterval(() => {
      void heartbeatPropertyRefreshJob(job.id, workerId);
    }, 10_000);

    if (!(await isRefreshPropertyActive(job))) {
      await completePropertyRefreshJob(job.id, "Property is inactive; refresh skipped");
      return;
    }

    if (job.jobType === "crawl_refresh") {
      await processCrawlRefreshJob(job);
      return;
    }

    if (job.jobType === "decision_refresh") {
      console.log(`[property-refresh][INFO] starting decision refresh job=${job.id} property=${job.propertyId}`);
      await updatePropertyRefreshJobProgress({
        jobId: job.id,
        phase: "analysis",
        message: "Recomputing ranked actions…",
      });
      await warmDashboardFromPayload(job);
      console.log(`[property-refresh][INFO] completed decision refresh job=${job.id} property=${job.propertyId}`);
      await completePropertyRefreshJob(job.id, "Decision refresh complete");
      return;
    }

    throw new Error(`Unsupported property refresh job type: ${job.jobType}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property refresh failed";
    console.error(`[property-refresh][ERROR] job failed job=${job.id} property=${job.propertyId} message=${message}`);
    await failPropertyRefreshJob(job.id, message, job.phase, {
      error: message,
    });
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}

export async function runSinglePropertyRefreshWorkerTick(
  workerId = `pref_${nanoid(8)}`,
  options: { lane?: PropertyRefreshClaimLane } = {},
) {
  const job = await claimNextPropertyRefreshJob(workerId, { lane: options.lane ?? "manual" });
  if (!job) return { processed: false as const };
  await processClaimedJob(job, workerId);
  return { processed: true as const, jobId: job.id };
}

export function startPropertyRefreshWorkerLoop(input: {
  lane?: PropertyRefreshClaimLane;
  workerName?: string;
  intervalMs?: number;
  maxPollMs?: number;
} = {}) {
  let stopped = false;
  let isRunning = false;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  const lane = input.lane ?? "manual";
  const workerId = `${input.workerName ?? "pref"}_${nanoid(8)}`;
  const intervalMs = input.intervalMs ?? parseInt(process.env.PROPERTY_REFRESH_WORKER_POLL_MS ?? "4000", 10);
  const maxPollMs = input.maxPollMs ?? parseInt(process.env.PROPERTY_REFRESH_WORKER_MAX_POLL_MS ?? "30000", 10);
  let idleCount = 0;

  const loop = async () => {
    if (stopped || isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSinglePropertyRefreshWorkerTick(workerId, { lane });
      processed = result.processed;
      if (processed) {
        console.log(`[property-refresh][INFO] processed job worker=${workerId} job=${result.jobId}`);
      }
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        idleCount = processed ? 0 : idleCount + 1;
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };

  console.log(`[property-refresh][INFO] loop started worker=${workerId} lane=${lane} pollMs=${intervalMs} maxPollMs=${maxPollMs}`);
  void loop();

  return {
    stop() {
      stopped = true;
      if (pendingTimeout) clearTimeout(pendingTimeout);
    },
  };
}
