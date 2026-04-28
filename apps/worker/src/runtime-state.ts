export type WorkerPhase =
  | "boot"
  | "imports"
  | "database-ready"
  | "single-tick"
  | "worker-loop"
  | "shutdown";

export type WorkerReadinessReason =
  | "worker_loop_not_started"
  | "worker_loop_stale"
  | "shutting_down"
  | "fatal_error";

export type WorkerRuntimeState = {
  phase: WorkerPhase;
  databaseReadyAtMs: number | null;
  loopStartedAtMs: number | null;
  lastLoopTickAtMs: number | null;
  shuttingDownAtMs: number | null;
  fatalErrorAtMs: number | null;
  fatalErrorMessage: string | null;
  currentJobId: string | null;
  currentJobStartedAtMs: number | null;
};

export type WorkerReadinessSnapshot = {
  ok: boolean;
  phase: WorkerPhase;
  reason: WorkerReadinessReason | null;
  databaseReadyAtMs: number | null;
  lastLoopTickAtMs: number | null;
  currentJobId: string | null;
  currentJobStartedAtMs: number | null;
};

export function createWorkerRuntimeState(): WorkerRuntimeState {
  return {
    phase: "boot",
    databaseReadyAtMs: null,
    loopStartedAtMs: null,
    lastLoopTickAtMs: null,
    shuttingDownAtMs: null,
    fatalErrorAtMs: null,
    fatalErrorMessage: null,
    currentJobId: null,
    currentJobStartedAtMs: null,
  };
}

export function markWorkerPhase(
  state: WorkerRuntimeState,
  phase: WorkerPhase,
  nowMs = Date.now(),
) {
  state.phase = phase;
  if (phase === "shutdown" && state.shuttingDownAtMs == null) {
    state.shuttingDownAtMs = nowMs;
  }
}

export function markDatabaseReady(state: WorkerRuntimeState, nowMs = Date.now()) {
  state.databaseReadyAtMs = nowMs;
}

export function markLoopTick(state: WorkerRuntimeState, nowMs = Date.now()) {
  if (state.loopStartedAtMs == null) {
    state.loopStartedAtMs = nowMs;
  }
  state.lastLoopTickAtMs = nowMs;
}

export function markShutdownRequested(state: WorkerRuntimeState, nowMs = Date.now()) {
  state.shuttingDownAtMs = nowMs;
  state.phase = "shutdown";
}

export function markFatalError(
  state: WorkerRuntimeState,
  error: unknown,
  nowMs = Date.now(),
) {
  state.fatalErrorAtMs = nowMs;
  state.fatalErrorMessage = error instanceof Error ? error.message : String(error);
}

export function markJobStart(
  state: WorkerRuntimeState,
  input: { jobId: string; nowMs?: number },
) {
  state.currentJobId = input.jobId;
  state.currentJobStartedAtMs = input.nowMs ?? Date.now();
}

export function markJobEnd(state: WorkerRuntimeState) {
  state.currentJobId = null;
  state.currentJobStartedAtMs = null;
}

export function buildWorkerReadinessSnapshot(
  state: WorkerRuntimeState,
  input?: { nowMs?: number; staleAfterMs?: number },
): WorkerReadinessSnapshot {
  const nowMs = input?.nowMs ?? Date.now();
  const staleAfterMs = input?.staleAfterMs ?? 60_000;

  let reason: WorkerReadinessReason | null = null;
  if (state.fatalErrorAtMs != null) {
    reason = "fatal_error";
  } else if (state.shuttingDownAtMs != null) {
    reason = "shutting_down";
  } else if (state.lastLoopTickAtMs == null) {
    reason = "worker_loop_not_started";
  } else if (nowMs - state.lastLoopTickAtMs > staleAfterMs) {
    reason = "worker_loop_stale";
  }

  return {
    ok: reason == null,
    phase: state.phase,
    reason,
    databaseReadyAtMs: state.databaseReadyAtMs,
    lastLoopTickAtMs: state.lastLoopTickAtMs,
    currentJobId: state.currentJobId,
    currentJobStartedAtMs: state.currentJobStartedAtMs,
  };
}
