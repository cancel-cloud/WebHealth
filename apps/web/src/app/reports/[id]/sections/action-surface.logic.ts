import type {
  RecommendationClass,
  RecommendationConfidenceLabel,
  RecommendationEffort,
  RecommendationFeedbackType,
  RecommendationOwner,
  RecommendationState,
  WeeklyActionRow,
} from "@webhealth/shared/lib/reports/types";

export type ReportSummaryChip = {
  label: string;
  value: string;
};

const OWNER_LABELS: Record<RecommendationOwner, string> = {
  seo: "SEO",
  content: "Content",
  developer: "Developer",
  decision_maker: "Founder",
};

const CLASS_LABELS: Record<RecommendationClass, string> = {
  protect: "Protect",
  lift: "Lift",
  expand: "Expand",
};

const CONFIDENCE_LABELS: Record<RecommendationConfidenceLabel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  exploratory: "Early signal",
};

const EFFORT_LABELS: Record<RecommendationEffort, string> = {
  XS: "Quick",
  S: "Small effort",
  M: "Medium effort",
  L: "Heavy lift",
};

const STATE_LABELS: Record<RecommendationState, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  ignored: "Ignored",
  snoozed: "Snoozed",
};

const FEEDBACK_LABELS: Record<RecommendationFeedbackType, string> = {
  helpful: "Helpful",
  not_helpful: "Not helpful",
  too_generic: "Too generic",
  not_applicable: "Not applicable",
  already_done: "Already done",
};

function formatCompactNumber(value: number) {
  if (value >= 1000) {
    return new Intl.NumberFormat("en", {
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(value);
  }

  return Math.round(value).toLocaleString();
}

export function formatRecommendationOwner(owner: RecommendationOwner) {
  return OWNER_LABELS[owner];
}

export function formatRecommendationClassLabel(recommendationClass: RecommendationClass) {
  return CLASS_LABELS[recommendationClass];
}

export function formatRecommendationConfidence(confidence: RecommendationConfidenceLabel) {
  return CONFIDENCE_LABELS[confidence];
}

export function formatRecommendationEffort(effort: RecommendationEffort) {
  return EFFORT_LABELS[effort];
}

export function formatRecommendationState(state: RecommendationState) {
  return STATE_LABELS[state];
}

export function formatRecommendationFeedback(feedback: RecommendationFeedbackType) {
  return FEEDBACK_LABELS[feedback];
}

export function formatValueAtStake(row: Pick<WeeklyActionRow, "valueAtStake">) {
  if (row.valueAtStake.clicksAtRisk) {
    return `About ${Math.round(row.valueAtStake.clicksAtRisk).toLocaleString()} clicks are exposed`;
  }

  if (row.valueAtStake.recoveryPotential) {
    return `About ${Math.round(row.valueAtStake.recoveryPotential).toLocaleString()} clicks can be recovered`;
  }

  if (row.valueAtStake.nearWinOpportunity) {
    return `About ${Math.round(row.valueAtStake.nearWinOpportunity).toLocaleString()} extra clicks are within reach`;
  }

  if (row.valueAtStake.trafficExposure) {
    return `About ${Math.round(row.valueAtStake.trafficExposure).toLocaleString()} impressions are exposed`;
  }

  return "Impact still needs to be sized";
}

export function formatValueAtStakeCompact(row: Pick<WeeklyActionRow, "valueAtStake">) {
  if (row.valueAtStake.clicksAtRisk) {
    return `${formatCompactNumber(row.valueAtStake.clicksAtRisk)} clicks at risk`;
  }

  if (row.valueAtStake.recoveryPotential) {
    return `${formatCompactNumber(row.valueAtStake.recoveryPotential)} recoverable clicks`;
  }

  if (row.valueAtStake.nearWinOpportunity) {
    return `${formatCompactNumber(row.valueAtStake.nearWinOpportunity)} reachable clicks`;
  }

  if (row.valueAtStake.trafficExposure) {
    return `${formatCompactNumber(row.valueAtStake.trafficExposure)} impressions exposed`;
  }

  return "Impact unscored";
}

export function getWeeklyActionSummaryChips(rows?: WeeklyActionRow[] | null): ReportSummaryChip[] {
  const data = rows ?? [];

  if (!data.length) return [];

  const protectCount = data.filter((row) => row.recommendationClass === "protect").length;
  const topStakeRow = data[0] ?? null;

  return [
    { label: "Actions", value: String(data.length) },
    { label: "Protect first", value: String(protectCount) },
    topStakeRow
      ? {
          label: "Top stake",
          value: formatValueAtStakeCompact(topStakeRow),
        }
      : null,
  ].filter((chip): chip is ReportSummaryChip => chip !== null);
}

export function toggleExpandedAction(currentId: string | null, nextId: string) {
  return currentId === nextId ? null : nextId;
}
