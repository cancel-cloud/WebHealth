import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readReportPageSource() {
  return readFile(new URL("./page.tsx", import.meta.url), "utf8");
}

async function readReportDetailClientViewSource() {
  return readFile(new URL("./report-detail-client-view.tsx", import.meta.url), "utf8");
}

test("report detail content uses the full authenticated shell width", async () => {
  const reportDetailClientViewSource = await readReportDetailClientViewSource();

  assert.ok(
    !reportDetailClientViewSource.includes("max-w-6xl"),
    "report detail should not narrow the shared authenticated shell width"
  );
  assert.match(
    reportDetailClientViewSource,
    /className="relative z-10 w-full bg-report-canvas px-1 py-4 sm:px-2 lg:py-6"/
  );
});

test("report detail does not render a top gradient overlay", async () => {
  const reportPageSource = await readReportPageSource();

  assert.ok(
    !reportPageSource.includes("bg-gradient-to-b from-primary/6 to-transparent"),
    "report detail should not render the top gradient overlay"
  );
});

test("report detail leads with the compact header and weekly action surface", async () => {
  const reportDetailClientViewSource = await readReportDetailClientViewSource();
  const reportPageSource = await readReportPageSource();

  assert.match(reportDetailClientViewSource, /data-report-header/);
  assert.match(reportPageSource, /data-report-secondary/);

  assert.ok(
    reportPageSource.indexOf("<ActionBacklog") < reportPageSource.indexOf("data-report-secondary"),
    "weekly actions should appear before the secondary evidence stack"
  );
  assert.ok(
    reportPageSource.indexOf("<NotRecommendedSection") < reportPageSource.indexOf("data-report-secondary"),
    "not recommended should stay subordinate but still above the evidence stack"
  );
});
