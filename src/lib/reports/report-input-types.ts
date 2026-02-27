import type { DashboardBlock } from "./dashboard-blocks";
import type { AiSeoReport } from "./types";
import type { DeterministicInsights } from "./deterministic-insights";

export type { DeterministicInsights as DeterministicResults };

export type AiResultsV1 = AiSeoReport;

export type AiResultsV2 = AiSeoReport & {
  dashboardBlocks: DashboardBlock[];
  reportSchemaVersion: "v2";
};
