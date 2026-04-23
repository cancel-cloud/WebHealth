import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readDemoPageSource() {
  return readFile(new URL("./page.tsx", import.meta.url), "utf8");
}

test("demo page uses the same action-first structure as the real report page", async () => {
  const source = await readDemoPageSource();

  assert.match(source, /data-report-header/);
  assert.match(source, /data-report-secondary/);
  assert.ok(
    source.indexOf("<ActionBacklog") < source.indexOf("<ExecutiveSummary"),
    "the demo should lead with weekly actions before summary context"
  );
  assert.ok(
    source.indexOf("<NotRecommendedSection") < source.indexOf("data-report-secondary"),
    "not recommended should stay below the main actions and above deeper evidence"
  );
  assert.ok(
    !source.includes("bg-gradient-to-b"),
    "the demo should not use the old gradient-heavy report background"
  );
});
