/**
 * Verify the fix: simulates normalizeDateStr logic against DB rows
 * Run: node scripts/test-after-fix.mjs
 */

import { config } from "dotenv";
import postgres from "postgres";
import fs from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const OUT_DIR = path.resolve("/tmp/webhealth-debug");

// Exact fix applied to metrics-cache.ts:
function normalizeDateStr(val) {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

async function main() {
  console.log("\n=== Post-Fix Cache Test ===\n");
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    // Build dates range Feb 11-24
    const datesInRange = [];
    const cursor = new Date("2026-02-11T00:00:00.000Z");
    const end = new Date("2026-02-24T00:00:00.000Z");
    while (cursor <= end) {
      datesInRange.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Test all 6 GSC properties
    const allProps = await sql`
      SELECT DISTINCT property_id FROM gsc_daily_facts ORDER BY property_id
    `;

    console.log(`Testing cache for ${allProps.length} GSC properties:\n`);
    const results = [];

    for (const { property_id } of allProps) {
      const rows = await sql`
        SELECT source_date FROM gsc_daily_facts
        WHERE property_id = ${property_id}
        AND source_date >= '2026-02-11'
        AND source_date <= '2026-02-24'
      `;

      // Apply fixed logic
      const fixedSet = new Set(rows.map(r => normalizeDateStr(r.source_date)));
      const hits = datesInRange.filter(d => fixedSet.has(d)).length;
      const misses = datesInRange.filter(d => !fixedSet.has(d)).length;

      console.log(`  ${property_id}: ${hits}/${datesInRange.length} hits, ${misses} misses`);
      results.push({ property_id, db_rows: rows.length, hits, misses });
    }

    // Simulate what the sync would do with the fix:
    console.log("\n=== Simulating sync with fixed cache (14d, refreshRecentDays=7) ===");
    const today = new Date("2026-02-25T00:00:00.000Z");
    const refreshCutoff = new Date(today);
    refreshCutoff.setUTCDate(refreshCutoff.getUTCDate() - 6); // refreshRecentDays=7 → cutoff = Feb 19

    let totalSkipped = 0;
    let totalRefreshed = 0;
    let totalFetched = 0;

    for (const { property_id } of allProps) {
      const rows = await sql`
        SELECT source_date FROM gsc_daily_facts
        WHERE property_id = ${property_id}
        AND source_date >= '2026-02-11'
        AND source_date <= '2026-02-24'
      `;
      const fixedSet = new Set(rows.map(r => normalizeDateStr(r.source_date)));

      for (const day of datesInRange) {
        const exists = fixedSet.has(day);
        const dayDate = new Date(`${day}T00:00:00.000Z`);
        const fresh = dayDate >= refreshCutoff;

        if (exists && !fresh) totalSkipped++;
        else if (exists && fresh) totalRefreshed++;
        else totalFetched++; // new data
      }
    }

    const totalPropDays = allProps.length * datesInRange.length;
    const totalApiCalls = totalFetched + totalRefreshed;

    console.log(`\n  Before fix: ${totalPropDays} API calls (all dates re-fetched every time)`);
    console.log(`  After fix:  ${totalApiCalls} API calls (${totalSkipped} skipped, ${totalRefreshed} refreshed, ${totalFetched} new)`);
    console.log(`  API call reduction: ${Math.round((1 - totalApiCalls / totalPropDays) * 100)}%`);

    const avgMsPerCall = 110_000 / 112; // ~982ms per call from last run
    const beforeMs = totalPropDays * avgMsPerCall;
    const afterMs = totalApiCalls * avgMsPerCall;
    console.log(`\n  Estimated time before fix: ${(beforeMs / 1000).toFixed(0)}s`);
    console.log(`  Estimated time after fix:  ${(afterMs / 1000).toFixed(0)}s`);

    const summaryData = {
      propertyResults: results,
      simulatedSkipped: totalSkipped,
      simulatedRefreshed: totalRefreshed,
      simulatedFetched: totalFetched,
      apiCallsBefore: totalPropDays,
      apiCallsAfter: totalApiCalls,
      reductionPercent: Math.round((1 - totalApiCalls / totalPropDays) * 100),
    };

    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(OUT_DIR, "14_post_fix_test.json"),
      JSON.stringify(summaryData, null, 2)
    );
    console.log(`\nSaved to /tmp/webhealth-debug/14_post_fix_test.json`);

  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
