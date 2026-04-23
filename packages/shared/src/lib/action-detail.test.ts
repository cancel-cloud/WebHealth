import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeActionDetailPayload } from "./action-detail";

test("sanitizeActionDetailPayload trims structured recommendation detail fields", () => {
  assert.deepEqual(
    sanitizeActionDetailPayload({
      observed: [" Fact 1 ", "", "Fact 2"],
      likelyCauses: [" Cause 1 "],
      recommendedActions: [" Action 1 ", "Action 2"],
      whyThisHelps: [" Why "],
      expectedOutcome: [" Outcome "],
      evidence: {
        deterministic: [
          { label: " Impressions ", value: " 4200 " },
          { label: "", value: "ignored" },
        ],
        inferred: [" Inferred support "],
      },
    }),
    {
      observed: ["Fact 1", "Fact 2"],
      likelyCauses: ["Cause 1"],
      recommendedActions: ["Action 1", "Action 2"],
      whyThisHelps: ["Why"],
      expectedOutcome: ["Outcome"],
      evidence: {
        deterministic: [{ label: "Impressions", value: "4200" }],
        inferred: ["Inferred support"],
      },
    }
  );
});
