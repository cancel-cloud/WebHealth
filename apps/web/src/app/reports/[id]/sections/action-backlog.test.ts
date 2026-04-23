import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readActionBacklogSource() {
  return readFile(new URL("./action-backlog.tsx", import.meta.url), "utf8");
}

test("weekly action surface is optimized for scanning and inline expansion", async () => {
  const source = await readActionBacklogSource();

  assert.match(source, /data-report-primary/);
  assert.match(source, /Value at stake/);
  assert.match(source, /First visible win/);
  assert.match(source, /toggleExpandedAction/);
  assert.ok(
    !source.includes("ActionDetailModal"),
    "weekly actions should expand inline instead of using the old modal surface"
  );
});

test("expanded action details preserve the intended trust-building order", async () => {
  const source = await readActionBacklogSource();

  const observedIndex = source.indexOf('title="Observed"');
  const likelyCauseIndex = source.indexOf('title="Likely cause"');
  const recommendedActionIndex = source.indexOf('title="Recommended action"');
  const whyThisHelpsIndex = source.indexOf('title="Why this helps"');
  const expectedOutcomeIndex = source.indexOf('title="Expected outcome"');
  const evidenceIndex = source.indexOf("Evidence");
  const successSignalIndex = source.indexOf("Success signal");

  assert.ok(observedIndex > -1, "observed section should exist");
  assert.ok(likelyCauseIndex > observedIndex, "likely cause should follow observed");
  assert.ok(recommendedActionIndex > likelyCauseIndex, "recommended action should follow likely cause");
  assert.ok(whyThisHelpsIndex > recommendedActionIndex, "why this helps should follow recommended action");
  assert.ok(expectedOutcomeIndex > whyThisHelpsIndex, "expected outcome should follow why this helps");
  assert.ok(evidenceIndex > expectedOutcomeIndex, "evidence should follow expected outcome");
  assert.ok(successSignalIndex > evidenceIndex, "success signal should follow evidence");
});
