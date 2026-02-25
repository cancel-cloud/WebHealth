/**
 * Test: Verify how Drizzle / postgres-js returns date column values
 * This tests whether existingGscDateSet cache-hit logic actually works.
 * Run: node scripts/test-date-cache.mjs
 */

import { config } from "dotenv";
import postgres from "postgres";
import fs from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const OUT_DIR = path.resolve("/tmp/webhealth-debug");

async function save(filename, data) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  await fs.writeFile(path.join(OUT_DIR, filename), content, "utf8");
}

async function main() {
  console.log("\n=== Date Cache Test ===\n");

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    // Get a known property that has data
    const rows = await sql`
      SELECT property_id, source_date
      FROM gsc_daily_facts
      ORDER BY source_date DESC
      LIMIT 5
    `;

    console.log("Raw rows from gsc_daily_facts (raw SQL):");
    for (const row of rows) {
      console.log(`  property_id=${row.property_id}`);
      console.log(`  source_date typeof: ${typeof row.source_date}`);
      console.log(`  source_date value: ${row.source_date}`);
      console.log(`  source_date instanceof Date: ${row.source_date instanceof Date}`);
      console.log(`  String(source_date): "${String(row.source_date)}"`);
      console.log(`  JSON.stringify: ${JSON.stringify(row.source_date)}`);
      if (row.source_date instanceof Date) {
        console.log(`  .toISOString().slice(0,10): "${row.source_date.toISOString().slice(0, 10)}"`);
        console.log(`  UTC date: ${row.source_date.getUTCFullYear()}-${String(row.source_date.getUTCMonth()+1).padStart(2,'0')}-${String(row.source_date.getUTCDate()).padStart(2,'0')}`);
      }
      console.log();
    }

    await save("13_date_type_test.json", rows.map(r => ({
      property_id: r.property_id,
      source_date_raw: String(r.source_date),
      source_date_type: typeof r.source_date,
      source_date_is_date: r.source_date instanceof Date,
      source_date_json: JSON.stringify(r.source_date),
      source_date_iso: r.source_date instanceof Date ? r.source_date.toISOString() : null,
    })));

    // Simulate what existingGscDateSet does:
    const testDate = "2026-02-24"; // should exist in DB
    const testPropertyId = rows[0]?.property_id;

    if (!testPropertyId) {
      console.log("No properties found. Can't test cache hit logic.");
      return;
    }

    const factRows = await sql`
      SELECT source_date FROM gsc_daily_facts
      WHERE property_id = ${testPropertyId}
      AND source_date >= '2026-02-11'
      AND source_date <= '2026-02-24'
    `;

    // Simulate existingGscDateSet (current code):
    const existingSet = new Set(factRows.map(r => String(r.source_date)));

    console.log(`\n=== Cache Hit Test for property: ${testPropertyId} ===`);
    console.log(`Rows in DB for Feb 11-24: ${factRows.length}`);
    console.log(`\nSet contents (first 5):`);
    [...existingSet].slice(0, 5).forEach(v => console.log(`  "${v}"`));

    const datesInRange = [];
    const start = new Date("2026-02-11T00:00:00.000Z");
    const end = new Date("2026-02-24T00:00:00.000Z");
    const cursor = new Date(start);
    while (cursor <= end) {
      datesInRange.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    console.log(`\nTesting cache lookup for ${datesInRange.length} dates:`);
    let hits = 0;
    let misses = 0;
    for (const day of datesInRange) {
      const found = existingSet.has(day);
      if (found) hits++;
      else misses++;
      console.log(`  ${day}: ${found ? "✓ HIT" : "✗ MISS"}`);
    }

    console.log(`\nResult: ${hits} hits, ${misses} misses out of ${datesInRange.length} dates`);
    if (misses > 0) {
      console.log("\n⚠️  CACHE IS BROKEN! Dates exist in DB but lookups always miss.");
      console.log("   Cause: String(date_object) ≠ 'YYYY-MM-DD' when date column returns a Date object.");

      // Show the fix
      const fixedSet = new Set(factRows.map(r => {
        if (r.source_date instanceof Date) {
          const d = r.source_date;
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
        }
        // If it's already a string like 'YYYY-MM-DD'
        return String(r.source_date).slice(0, 10);
      }));

      console.log("\nWith fixed Set:");
      let fixedHits = 0;
      for (const day of datesInRange) {
        const found = fixedSet.has(day);
        if (found) fixedHits++;
        process.stdout.write(`  ${day}: ${found ? "✓ HIT" : "✗ MISS"}\n`);
      }
      console.log(`Fixed result: ${fixedHits} hits out of ${datesInRange.length} dates`);
    } else {
      console.log("\n✓ Cache lookup works correctly.");
    }

    const result = {
      rowsInDb: factRows.length,
      setContents: [...existingSet].slice(0, 5),
      cacheHits: hits,
      cacheMisses: misses,
      dateColumnType: typeof factRows[0]?.source_date,
      dateColumnIsDate: factRows[0]?.source_date instanceof Date,
    };
    await save("13_cache_test_result.json", result);
    console.log(`\nSaved to /tmp/webhealth-debug/13_cache_test_result.json`);

  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
