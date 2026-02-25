/**
 * Sync Debug Script
 * Queries DB state for lukas@devbrew.dev and saves all results to /tmp/webhealth-debug/
 * Run: node scripts/debug-sync.mjs
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
  const fullPath = path.join(OUT_DIR, filename);
  await fs.writeFile(fullPath, content, "utf8");
  console.log(`  → saved ${fullPath}`);
}

async function main() {
  console.log("\n=== WebHealth Sync Debugger ===\n");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    // ─── 1. Check which tables exist ────────────────────────────────────────
    console.log("1. Checking which tables exist in the database...");
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    await save("01_existing_tables.json", tables);
    console.log("   Tables:", tables.map((t) => t.table_name).join(", "));

    const tableNames = new Set(tables.map((t) => t.table_name));
    const requiredNew = [
      "metrics_backfill_jobs",
      "gsc_daily_raw",
      "gsc_daily_facts",
      "ga4_daily_raw",
      "ga4_daily_facts",
      "property_daily_ai_summaries",
    ];
    const missing = requiredNew.filter((t) => !tableNames.has(t));
    if (missing.length > 0) {
      console.log("   ⚠️  MISSING NEW TABLES:", missing.join(", "));
    } else {
      console.log("   ✓  All new metrics tables exist");
    }

    // ─── 2. Check drizzle migrations journal ────────────────────────────────
    console.log("\n2. Checking drizzle migrations journal...");
    try {
      const migrations = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at`;
      await save("02_migrations_applied.json", migrations);
      console.log("   Applied migrations:", migrations.map((m) => m.hash).join(", "));
    } catch (e) {
      const msg = `Could not query migrations journal: ${e.message}`;
      console.log(`   ⚠️  ${msg}`);
      await save("02_migrations_applied.json", { error: msg });
    }

    // ─── 3. Check columns on key tables ─────────────────────────────────────
    console.log("\n3. Checking columns on key tables...");
    const colChecks = [
      { table: "properties", columns: ["id", "team_id", "type", "name", "url", "sync_status", "last_synced_at", "active"] },
      { table: "user", columns: ["id", "email", "name", "is_restricted", "restriction_message"] },
    ];
    const colResults = {};
    for (const { table, columns } of colChecks) {
      if (!tableNames.has(table)) {
        colResults[table] = { error: "table does not exist" };
        continue;
      }
      const cols = await sql`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      const existingCols = new Set(cols.map((c) => c.column_name));
      const missingCols = columns.filter((c) => !existingCols.has(c));
      colResults[table] = {
        allColumns: cols,
        missingExpected: missingCols,
      };
      if (missingCols.length > 0) {
        console.log(`   ⚠️  ${table} is MISSING columns: ${missingCols.join(", ")}`);
      } else {
        console.log(`   ✓  ${table} has all expected columns`);
      }
    }
    await save("03_column_checks.json", colResults);

    // ─── 4. Find user lukas@devbrew.dev ─────────────────────────────────────
    console.log("\n4. Querying user lukas@devbrew.dev...");
    const users = await sql`SELECT * FROM "user" WHERE email = 'lukas@devbrew.dev'`;
    await save("04_user.json", users);

    if (users.length === 0) {
      console.log("   ⚠️  User not found");
      await sql.end();
      return;
    }

    const user = users[0];
    console.log(`   ✓  Found user: id=${user.id}, name=${user.name}`);

    // ─── 5. User's Google account ────────────────────────────────────────────
    console.log("\n5. Querying Google account for user...");
    const accounts = await sql`
      SELECT id, account_id, provider_id,
             CASE WHEN access_token IS NOT NULL THEN 'SET' ELSE 'NULL' END AS access_token_status,
             CASE WHEN refresh_token IS NOT NULL THEN 'SET' ELSE 'NULL' END AS refresh_token_status,
             access_token_expires_at, scope, created_at, updated_at
      FROM account
      WHERE user_id = ${user.id}
    `;
    await save("05_google_account.json", accounts);
    const googleAccount = accounts.find((a) => a.provider_id === "google");
    if (!googleAccount) {
      console.log("   ⚠️  No Google account linked");
    } else {
      console.log(`   ✓  Google account: access_token=${googleAccount.access_token_status}, refresh_token=${googleAccount.refresh_token_status}`);
      console.log(`      Expires: ${googleAccount.access_token_expires_at}`);
    }

    // ─── 6. User's team ──────────────────────────────────────────────────────
    console.log("\n6. Querying team membership...");
    const teamMembers = await sql`
      SELECT tm.*, t.name AS team_name, t.tier
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = ${user.id}
    `;
    await save("06_team_members.json", teamMembers);
    if (teamMembers.length === 0) {
      console.log("   ⚠️  User has no team");
    } else {
      const team = teamMembers[0];
      console.log(`   ✓  Team: id=${team.team_id}, name=${team.team_name}, tier=${team.tier}`);
      const teamId = team.team_id;

      // ─── 7. Properties for this team ──────────────────────────────────────
      console.log("\n7. Querying properties...");
      const properties = await sql`SELECT * FROM properties WHERE team_id = ${teamId} ORDER BY created_at DESC`;
      await save("07_properties.json", properties);
      console.log(`   Found ${properties.length} properties`);
      properties.forEach((p) => {
        console.log(`     [${p.type}] ${p.name} | id=${p.id} | ga4_linked=${p.ga4_property_id ?? "none"}`);
      });

      // ─── 8. System logs (recent sync attempts) ────────────────────────────
      console.log("\n8. Querying recent system_logs for this user...");
      const logs = await sql`
        SELECT * FROM system_logs
        WHERE target_user_id = ${user.id} OR triggered_by = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      await save("08_system_logs.json", logs);
      console.log(`   Found ${logs.length} log entries`);
      logs.forEach((log) => {
        console.log(`     [${log.created_at?.toISOString?.() ?? log.created_at}] action=${log.action} status=${log.status}`);
        if (log.details?.error) console.log(`       ERROR: ${log.details.error}`);
      });
    }

    // ─── 9. Metrics backfill jobs (if table exists) ───────────────────────
    if (tableNames.has("metrics_backfill_jobs")) {
      console.log("\n9. Querying metrics_backfill_jobs...");
      const jobs = await sql`
        SELECT * FROM metrics_backfill_jobs
        WHERE triggered_by_user_id = ${user.id} OR target_user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 10
      `;
      await save("09_metrics_backfill_jobs.json", jobs);
      console.log(`   Found ${jobs.length} backfill jobs`);
      jobs.forEach((j) => {
        console.log(`     [${j.created_at?.toISOString?.() ?? j.created_at}] id=${j.id} status=${j.status} error=${j.error ?? "none"}`);
      });
    } else {
      console.log("\n9. Skipping metrics_backfill_jobs query (table does not exist)");
      await save("09_metrics_backfill_jobs.json", { skipped: "table does not exist" });
    }

    // ─── 10. GSC daily facts count ────────────────────────────────────────
    if (tableNames.has("gsc_daily_facts")) {
      console.log("\n10. Checking GSC daily facts coverage...");
      const gscCoverage = await sql`
        SELECT property_id, MIN(source_date) as earliest, MAX(source_date) as latest, COUNT(*) as day_count
        FROM gsc_daily_facts
        GROUP BY property_id
        ORDER BY property_id
      `;
      await save("10_gsc_facts_coverage.json", gscCoverage);
      if (gscCoverage.length === 0) {
        console.log("   No GSC facts rows found");
      } else {
        gscCoverage.forEach((g) => {
          console.log(`   property_id=${g.property_id}: ${g.day_count} days (${g.earliest} → ${g.latest})`);
        });
      }
    } else {
      await save("10_gsc_facts_coverage.json", { skipped: "table does not exist" });
    }

    // ─── 11. GA4 daily facts count ────────────────────────────────────────
    if (tableNames.has("ga4_daily_facts")) {
      console.log("\n11. Checking GA4 daily facts coverage...");
      const ga4Coverage = await sql`
        SELECT ga4_property_id, MIN(source_date) as earliest, MAX(source_date) as latest, COUNT(*) as day_count
        FROM ga4_daily_facts
        GROUP BY ga4_property_id
        ORDER BY ga4_property_id
      `;
      await save("11_ga4_facts_coverage.json", ga4Coverage);
      if (ga4Coverage.length === 0) {
        console.log("   No GA4 facts rows found");
      } else {
        ga4Coverage.forEach((g) => {
          console.log(`   ga4_property_id=${g.ga4_property_id}: ${g.day_count} days (${g.earliest} → ${g.latest})`);
        });
      }
    } else {
      await save("11_ga4_facts_coverage.json", { skipped: "table does not exist" });
    }

    // ─── 12. Make a raw HTTP test call to the sync API ────────────────────
    console.log("\n12. Testing raw HTTP response from sync API...");
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    try {
      const testRes = await fetch(`${baseUrl}/api/admin/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, includeGsc: true, includeGa4: true, timeframe: "14d" }),
      });
      const rawText = await testRes.text();
      const responseInfo = {
        status: testRes.status,
        statusText: testRes.statusText,
        headers: Object.fromEntries(testRes.headers.entries()),
        contentType: testRes.headers.get("content-type"),
        bodyPreview: rawText.slice(0, 500),
        bodyLength: rawText.length,
        isHtml: rawText.trimStart().startsWith("<"),
        isJson: rawText.trimStart().startsWith("{") || rawText.trimStart().startsWith("["),
      };
      await save("12_raw_api_response.json", responseInfo);
      await save("12_raw_api_response_body.txt", rawText);
      console.log(`   Status: ${testRes.status} ${testRes.statusText}`);
      console.log(`   Content-Type: ${testRes.headers.get("content-type")}`);
      console.log(`   Body starts with HTML: ${responseInfo.isHtml}`);
      console.log(`   Body starts with JSON: ${responseInfo.isJson}`);
      if (responseInfo.isHtml) {
        console.log("   ⚠️  SERVER IS RETURNING HTML — this is the source of the '<' error in the toast!");
        console.log(`   Body preview: ${rawText.slice(0, 200)}`);
      } else {
        console.log(`   Body preview: ${rawText.slice(0, 200)}`);
      }
    } catch (fetchErr) {
      const errInfo = { error: fetchErr.message, note: "Could not reach sync API — server may not be running or auth required" };
      await save("12_raw_api_response.json", errInfo);
      console.log(`   ⚠️  Could not reach API: ${fetchErr.message}`);
      console.log("      (This is expected if the dev server requires auth cookies — see note below)");
    }

    console.log("\n─── Summary ─────────────────────────────────────────────");
    console.log(`All debug files saved to: ${OUT_DIR}/`);
    console.log("Files:");
    const files = await fs.readdir(OUT_DIR);
    files.sort().forEach((f) => console.log(`  ${f}`));
    console.log("\nNote: The HTTP test (step 12) will return 401 Unauthorized because");
    console.log("it runs without auth cookies. That is expected and not the issue.");
    console.log("The '<' error occurs AFTER authentication succeeds in the browser.\n");

  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("\nScript error:", err);
  process.exit(1);
});
