export function shouldForceExitForStuckJob(input: {
  currentJobStartedAtMs: number | null;
  nowMs: number;
  maxJobRuntimeMs: number;
}) {
  if (input.currentJobStartedAtMs == null) return false;
  return input.nowMs - input.currentJobStartedAtMs > input.maxJobRuntimeMs;
}
