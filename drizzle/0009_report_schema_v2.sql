ALTER TABLE "reports"
  ADD COLUMN IF NOT EXISTS "report_schema_version" text DEFAULT 'v1' NOT NULL,
  ADD COLUMN IF NOT EXISTS "dashboard_blocks_json" jsonb;
