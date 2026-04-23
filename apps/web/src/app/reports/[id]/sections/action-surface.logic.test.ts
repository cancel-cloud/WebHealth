import assert from "node:assert/strict";
import test from "node:test";

import {
  formatRecommendationClassLabel,
  formatRecommendationConfidence,
  formatRecommendationEffort,
  formatRecommendationFeedback,
  formatRecommendationOwner,
  formatRecommendationState,
  formatValueAtStake,
  formatValueAtStakeCompact,
  getWeeklyActionSummaryChips,
  toggleExpandedAction,
} from "./action-surface.logic";

test("recommendation labels are rendered in plain user-facing language", () => {
  assert.equal(formatRecommendationOwner("decision_maker"), "Founder");
  assert.equal(formatRecommendationClassLabel("protect"), "Protect");
  assert.equal(formatRecommendationConfidence("exploratory"), "Early signal");
  assert.equal(formatRecommendationEffort("XS"), "Quick");
  assert.equal(formatRecommendationState("in_progress"), "In progress");
  assert.equal(formatRecommendationFeedback("already_done"), "Already done");
});

test("value at stake copy avoids schema language", () => {
  assert.equal(
    formatValueAtStake({ valueAtStake: { clicksAtRisk: 180 } }),
    "About 180 clicks are exposed"
  );
  assert.equal(
    formatValueAtStake({ valueAtStake: { nearWinOpportunity: 572 } }),
    "About 572 extra clicks are within reach"
  );
  assert.equal(
    formatValueAtStakeCompact({ valueAtStake: { trafficExposure: 8420 } }),
    "8.4K impressions exposed"
  );
});

test("summary chips stay compact and useful", () => {
  const chips = getWeeklyActionSummaryChips([
    {
      id: "wa-1",
      rank: 1,
      area: "technical",
      title: "Resolve the broken internal links on 3 traffic-carrying pages",
      whyNow: "This affects 3 pages that already bring in traffic, so fixing it protects existing visits before they slip further.",
      recommendationClass: "protect",
      primaryMetric: "crawl_health",
      expectedDirection: "recover",
      successWindow: "0-7d",
      successSignal: "The issue clears on the next crawl.",
      timeToValue: "days",
      firstVisibleWin: "The issue should clear on the next validation crawl.",
      valueAtStake: { clicksAtRisk: 180 },
      confidenceLabel: "high",
      confidenceScore: 0.92,
      confidenceBasis: "Measured directly.",
      owner: "developer",
      effort: "S",
      priorityReason: "This protects existing traffic first.",
      detail: {
        observed: [],
        likelyCauses: [],
        recommendedActions: [],
        whyThisHelps: [],
        expectedOutcome: [],
        evidence: {
          deterministic: [],
          inferred: [],
        },
      },
    },
  ]);

  assert.deepEqual(chips, [
    { label: "Actions", value: "1" },
    { label: "Protect first", value: "1" },
    { label: "Top stake", value: "180 clicks at risk" },
  ]);
});

test("only one action stays expanded at a time", () => {
  assert.equal(toggleExpandedAction(null, "wa-1"), "wa-1");
  assert.equal(toggleExpandedAction("wa-1", "wa-2"), "wa-2");
  assert.equal(toggleExpandedAction("wa-2", "wa-2"), null);
});
