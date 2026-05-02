export function buildAiRunCenterCounts(runs: Array<{ status: string; costEstimateUsd?: string | number | null }>) {
  return {
    counts: {
      queued: runs.filter((run) => run.status === "queued").length,
      processing: runs.filter((run) => run.status === "processing").length,
      complete: runs.filter((run) => run.status === "complete").length,
      failed: runs.filter((run) => run.status === "failed").length,
      total: runs.length,
    },
    estimatedCostUsd: Number(
      runs
        .reduce((sum, run) => sum + Number(run.costEstimateUsd ?? 0), 0)
        .toFixed(6),
    ),
  };
}
