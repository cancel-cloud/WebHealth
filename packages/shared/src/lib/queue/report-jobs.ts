import { nanoid } from "nanoid";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { reportJobEvents, reportJobs, reports } from "@webhealth/shared/db/schema";
import { normalizeClaimedReportJobRow } from "@webhealth/shared/lib/queue/report-job-row-shape";

export type ReportJobKind = "generate_report" | "generate_detail" | "render_xlsx";
export type ReportJobStatus = "queued" | "processing" | "complete" | "failed";
export type ReportJobPhase =
  | "queued"
  | "detail"
  | "preprocess"
  | "site_changes"
  | "deterministic_scoring"
  | "openai_start"
  | "openai_poll"
  | "parse"
  | "store_report"
  | "xlsx"
  | "done";

export type QueueLeaseConfig = {
  leaseSeconds: number;
  heartbeatSeconds: number;
  maxActiveGlobal: number;
  maxActivePerTeam: number;
  maxActiveDetailGlobal: number;
  maxActiveDetailPerTeam: number;
};

export function getQueueLeaseConfig(): QueueLeaseConfig {
  return {
    leaseSeconds: parseInt(process.env.REPORT_WORKER_LEASE_SECONDS ?? "45", 10),
    heartbeatSeconds: parseInt(process.env.REPORT_WORKER_HEARTBEAT_SECONDS ?? "10", 10),
    maxActiveGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_GLOBAL ?? "2", 10),
    maxActivePerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_PER_TEAM ?? "1", 10),
    maxActiveDetailGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_GLOBAL ?? "6", 10),
    maxActiveDetailPerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_PER_TEAM ?? "3", 10),
  };
}

export type EnqueueReportJobInput = {
  reportId: string;
  teamId: string;
  kind: ReportJobKind;
  priority?: number;
  payload?: Record<string, unknown>;
};

export async function enqueueReportJob(input: EnqueueReportJobInput) {
  const jobId = `rj_${nanoid(12)}`;

  const [job] = await db
    .insert(reportJobs)
    .values({
      id: jobId,
      reportId: input.reportId,
      teamId: input.teamId,
      kind: input.kind,
      priority: input.priority ?? 100,
      payload: input.payload ?? {},
      phase: "queued",
      status: "queued",
    })
    .returning();

  await appendReportJobEvent({
    jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    phase: "queued",
    level: "info",
    message: `Job enqueued (${input.kind})`,
  });

  await db.execute(sql`SELECT pg_notify('job_available', '')`);

  return job;
}

export async function appendReportJobEvent(input: {
  jobId: string;
  reportId: string;
  teamId: string;
  phase: string;
  level?: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
}) {
  const [event] = await db
    .insert(reportJobEvents)
    .values({
      id: `rje_${nanoid(12)}`,
      jobId: input.jobId,
      reportId: input.reportId,
      teamId: input.teamId,
      phase: input.phase,
      level: input.level ?? "info",
      message: input.message,
      meta: input.meta ?? null,
    })
    .returning();
  return event;
}

export async function getReportQueueStats() {
  const [globalCounts] = await db.execute(
    sql<{ active_processing: number; queued_count: number }>`
      select
        count(*) filter (where status = 'processing' and claim_expires_at > now())::int as active_processing,
        count(*) filter (where status = 'queued')::int as queued_count
      from report_jobs
    `
  );

  const perTeam = await db.execute(
    sql<{ team_id: string; active_jobs: number }>`
      select team_id, count(*)::int as active_jobs
      from report_jobs
      where status = 'processing' and claim_expires_at > now()
      group by team_id
      order by active_jobs desc, team_id asc
      limit 20
    `
  );

  const leasedJobs = await db
    .select({
      id: reportJobs.id,
      reportId: reportJobs.reportId,
      teamId: reportJobs.teamId,
      kind: reportJobs.kind,
      phase: reportJobs.phase,
      claimedBy: reportJobs.claimedBy,
      claimExpiresAt: reportJobs.claimExpiresAt,
      heartbeatAt: reportJobs.heartbeatAt,
      attempts: reportJobs.attempts,
      status: reportJobs.status,
    })
    .from(reportJobs)
    .where(and(eq(reportJobs.status, "processing"), sql`${reportJobs.claimExpiresAt} > now()`))
    .orderBy(desc(reportJobs.heartbeatAt))
    .limit(50);

  return {
    activeJobsGlobal: globalCounts?.active_processing ?? 0,
    queuedJobsCount: globalCounts?.queued_count ?? 0,
    activeJobsPerTeam: (perTeam as unknown as Array<{ team_id: string; active_jobs: number }>).map((r) => ({
      teamId: r.team_id,
      activeJobs: r.active_jobs,
    })),
    leasedJobs,
  };
}

export async function listRecentReportJobs(limit = 50) {
  return db
    .select({
      id: reportJobs.id,
      reportId: reportJobs.reportId,
      teamId: reportJobs.teamId,
      kind: reportJobs.kind,
      status: reportJobs.status,
      phase: reportJobs.phase,
      attempts: reportJobs.attempts,
      maxAttempts: reportJobs.maxAttempts,
      lastError: reportJobs.lastError,
      claimExpiresAt: reportJobs.claimExpiresAt,
      heartbeatAt: reportJobs.heartbeatAt,
      claimedBy: reportJobs.claimedBy,
      createdAt: reportJobs.createdAt,
      updatedAt: reportJobs.updatedAt,
    })
    .from(reportJobs)
    .orderBy(desc(reportJobs.createdAt))
    .limit(limit);
}

export async function listReportJobEvents(input?: {
  reportId?: string;
  jobId?: string;
  teamId?: string;
  limit?: number;
}) {
  const filters = [];
  if (input?.reportId) filters.push(eq(reportJobEvents.reportId, input.reportId));
  if (input?.jobId) filters.push(eq(reportJobEvents.jobId, input.jobId));
  if (input?.teamId) filters.push(eq(reportJobEvents.teamId, input.teamId));

  return db
    .select()
    .from(reportJobEvents)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(reportJobEvents.createdAt))
    .limit(input?.limit ?? 200);
}

export type ClaimedReportJob = typeof reportJobs.$inferSelect;

export async function claimNextReportJob(workerId: string): Promise<ClaimedReportJob | null> {
  const cfg = getQueueLeaseConfig();

  const rows = await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      with candidate as (
        select j.id
        from report_jobs j
        where (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now())
        )
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailGlobal}
          else (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind <> 'generate_detail'
          ) < ${cfg.maxActiveGlobal}
        end
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailPerTeam}
          else (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind <> 'generate_detail'
          ) < ${cfg.maxActivePerTeam}
        end
        order by j.priority asc, j.created_at asc
        for update skip locked
        limit 1
      )
      update report_jobs j
      set
        status = 'processing',
        claimed_by = ${workerId},
        claimed_at = now(),
        heartbeat_at = now(),
        claim_expires_at = now() + (${cfg.leaseSeconds} || ' seconds')::interval,
        started_at = coalesce(j.started_at, now()),
        attempts = j.attempts + 1,
        updated_at = now()
      from candidate
      where j.id = candidate.id
      returning j.*
    `);
    return result;
  });

  const rawRow = (rows as unknown as Array<Record<string, unknown>>)[0] ?? null;
  const row = rawRow ? (normalizeClaimedReportJobRow(rawRow) as ClaimedReportJob) : null;
  if (!row) return null;

  await appendReportJobEvent({
    jobId: row.id,
    reportId: row.reportId,
    teamId: row.teamId,
    phase: row.phase,
    level: "info",
    message: `Job claimed by ${workerId}`,
    meta: { leaseSeconds: cfg.leaseSeconds },
  });

  return row;
}

export async function heartbeatReportJob(jobId: string, workerId: string) {
  const cfg = getQueueLeaseConfig();
  const [job] = await db
    .update(reportJobs)
    .set({
      heartbeatAt: new Date(),
      claimExpiresAt: sql`now() + (${cfg.leaseSeconds} || ' seconds')::interval`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(reportJobs.id, jobId), eq(reportJobs.status, "processing"), eq(reportJobs.claimedBy, workerId))
    )
    .returning();
  return job ?? null;
}

export async function updateReportJobPhase(jobId: string, phase: ReportJobPhase, meta?: Record<string, unknown>) {
  const [job] = await db.update(reportJobs).set({ phase, updatedAt: new Date() }).where(eq(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: `Phase -> ${phase}`,
      meta,
    });
  }
  return job ?? null;
}

export async function completeReportJob(jobId: string, phase: ReportJobPhase = "done") {
  const [job] = await db
    .update(reportJobs)
    .set({
      status: "complete",
      phase,
      finishedAt: new Date(),
      claimExpiresAt: null,
      heartbeatAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, jobId))
    .returning();

  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: "Job completed",
    });
  }

  return job ?? null;
}

export async function requeueJobForRetry(jobId: string, errorMessage: string, delaySeconds = 30) {
  const [job] = await db
    .update(reportJobs)
    .set({
      status: "queued",
      phase: "queued",
      claimedBy: null,
      claimedAt: null,
      claimExpiresAt: null,
      heartbeatAt: null,
      finishedAt: null,
      lastError: errorMessage,
      availableAt: sql`now() + (${delaySeconds} || ' seconds')::interval`,
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, jobId))
    .returning();

  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "queued",
      level: "warn",
      message: `Job re-queued for retry (attempt ${job.attempts} of ${job.maxAttempts}): ${errorMessage}`,
    });
  }

  return job ?? null;
}

export async function failReportJob(jobId: string, errorMessage: string, phase?: string) {
  const [job] = await db
    .update(reportJobs)
    .set({
      status: "failed",
      lastError: errorMessage,
      phase: (phase as ReportJobPhase | undefined) ?? "done",
      finishedAt: new Date(),
      claimExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, jobId))
    .returning();

  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: job.phase,
      level: "error",
      message: errorMessage,
    });
  }

  return job ?? null;
}

export async function requeueReportJobsForReport(reportId: string, kinds?: ReportJobKind[]) {
  const filters = [eq(reportJobs.reportId, reportId)];
  if (kinds?.length) filters.push(inArray(reportJobs.kind, kinds));
  const rows = await db
    .update(reportJobs)
    .set({
      status: "queued",
      phase: "queued",
      availableAt: new Date(),
      claimedAt: null,
      claimExpiresAt: null,
      heartbeatAt: null,
      claimedBy: null,
      finishedAt: null,
      updatedAt: new Date(),
    })
    .where(and(...filters))
    .returning();
  return rows;
}

export async function findLatestJobForReport(reportId: string, kinds?: ReportJobKind[]) {
  const filters = [eq(reportJobs.reportId, reportId)];
  if (kinds?.length) filters.push(inArray(reportJobs.kind, kinds));
  return db.query.reportJobs.findFirst({
    where: and(...filters),
    orderBy: (j, { desc }) => [desc(j.createdAt)],
  });
}

export async function getActiveJobSummaryForReport(reportId: string) {
  const jobs = await db
    .select({
      id: reportJobs.id,
      kind: reportJobs.kind,
      status: reportJobs.status,
      phase: reportJobs.phase,
      attempts: reportJobs.attempts,
      heartbeatAt: reportJobs.heartbeatAt,
      claimExpiresAt: reportJobs.claimExpiresAt,
      lastError: reportJobs.lastError,
      claimedBy: reportJobs.claimedBy,
      createdAt: reportJobs.createdAt,
    })
    .from(reportJobs)
    .where(eq(reportJobs.reportId, reportId))
    .orderBy(desc(reportJobs.createdAt));

  return jobs;
}

export async function enqueueGenerateReportFromReportId(reportId: string) {
  const report = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, reportId),
  });
  if (!report) throw new Error("Report not found");
  return enqueueReportJob({ reportId: report.id, teamId: report.teamId, kind: "generate_report" });
}

export async function enqueueXlsxRenderJob(reportId: string) {
  const report = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, reportId),
  });
  if (!report) throw new Error("Report not found");
  return enqueueReportJob({ reportId: report.id, teamId: report.teamId, kind: "render_xlsx", priority: 110 });
}

export async function touchReportUpdatedAt(reportId: string) {
  await db.update(reports).set({ updatedAt: new Date() }).where(eq(reports.id, reportId));
}
