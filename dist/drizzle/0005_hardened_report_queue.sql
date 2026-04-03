-- Hardened AI report queue + debug/cost infrastructure (Plan A)

-- Extend reports table with AI/XLSX/tracing fields
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_status" text DEFAULT 'queued';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_report_json" jsonb;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_report_markdown" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_input_snapshot_sanitized" jsonb;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_model" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_output_strategy" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_prompt_version_id" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_prompt_snapshot" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "openai_response_id" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_usage" jsonb;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "ai_estimated_cost_usd" numeric(12,6);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "openai_request_ids" jsonb;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "site_changes" jsonb;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "xlsx_status" text DEFAULT 'pending';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "xlsx_artifact_key" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "xlsx_artifact_url" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "error" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- AI prompt/config tables
CREATE TABLE IF NOT EXISTS "ai_report_prompt_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "template" text NOT NULL,
  "examples" text,
  "schema_version" text DEFAULT 'v1' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "ai_report_prompt_versions"
  ADD CONSTRAINT "ai_report_prompt_versions_created_by_user_id_user_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE TABLE IF NOT EXISTS "ai_report_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "model" text NOT NULL,
  "output_strategy" text DEFAULT 'json_schema' NOT NULL,
  "temperature" numeric(4,2) DEFAULT 0.2 NOT NULL,
  "max_output_tokens" integer DEFAULT 6000 NOT NULL,
  "input_token_budget" integer DEFAULT 90000 NOT NULL,
  "language" text DEFAULT 'de' NOT NULL,
  "service_tier" text DEFAULT 'default' NOT NULL,
  "use_background_mode" boolean DEFAULT true NOT NULL,
  "use_prompt_caching" boolean DEFAULT true NOT NULL,
  "schema_version" text DEFAULT 'v1' NOT NULL,
  "prompt_version_id" text,
  "updated_by_user_id" text,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "ai_report_settings"
  ADD CONSTRAINT "ai_report_settings_prompt_version_id_ai_report_prompt_versions_id_fk"
  FOREIGN KEY ("prompt_version_id") REFERENCES "public"."ai_report_prompt_versions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_report_settings"
  ADD CONSTRAINT "ai_report_settings_updated_by_user_id_user_id_fk"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

-- Queue jobs with leases / heartbeats
CREATE TABLE IF NOT EXISTS "report_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "report_id" text NOT NULL,
  "team_id" text NOT NULL,
  "kind" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "phase" text DEFAULT 'queued' NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "available_at" timestamp DEFAULT now() NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "claimed_by" text,
  "claimed_at" timestamp,
  "claim_expires_at" timestamp,
  "heartbeat_at" timestamp,
  "started_at" timestamp,
  "finished_at" timestamp,
  "last_error" text,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "report_jobs"
  ADD CONSTRAINT "report_jobs_report_id_reports_id_fk"
  FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_jobs"
  ADD CONSTRAINT "report_jobs_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "report_jobs_status_available_idx"
  ON "report_jobs" ("status","available_at","priority","created_at");
CREATE INDEX IF NOT EXISTS "report_jobs_team_status_claim_idx"
  ON "report_jobs" ("team_id","status","claim_expires_at");
CREATE INDEX IF NOT EXISTS "report_jobs_report_kind_status_idx"
  ON "report_jobs" ("report_id","kind","status");

-- Job event log
CREATE TABLE IF NOT EXISTS "report_job_events" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text NOT NULL,
  "report_id" text NOT NULL,
  "team_id" text NOT NULL,
  "phase" text NOT NULL,
  "level" text DEFAULT 'info' NOT NULL,
  "message" text NOT NULL,
  "meta" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "report_job_events"
  ADD CONSTRAINT "report_job_events_job_id_report_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."report_jobs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_job_events"
  ADD CONSTRAINT "report_job_events_report_id_reports_id_fk"
  FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_job_events"
  ADD CONSTRAINT "report_job_events_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "report_job_events_job_created_idx" ON "report_job_events" ("job_id","created_at");
CREATE INDEX IF NOT EXISTS "report_job_events_report_created_idx" ON "report_job_events" ("report_id","created_at");
CREATE INDEX IF NOT EXISTS "report_job_events_team_created_idx" ON "report_job_events" ("team_id","created_at");

-- Crawl page snapshots + current page registry for deterministic change detection
CREATE TABLE IF NOT EXISTS "crawl_page_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "report_id" text NOT NULL,
  "crawl_id" text,
  "property_id" text NOT NULL,
  "team_id" text NOT NULL,
  "url" text NOT NULL,
  "canonical_url" text NOT NULL,
  "title" text,
  "meta_description" text,
  "h1_texts" jsonb,
  "extracted_text_hash" text,
  "seo_fingerprint_hash" text NOT NULL,
  "machine_diff_summary" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "crawl_page_snapshots"
  ADD CONSTRAINT "crawl_page_snapshots_report_id_reports_id_fk"
  FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots"
  ADD CONSTRAINT "crawl_page_snapshots_crawl_id_crawls_id_fk"
  FOREIGN KEY ("crawl_id") REFERENCES "public"."crawls"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots"
  ADD CONSTRAINT "crawl_page_snapshots_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots"
  ADD CONSTRAINT "crawl_page_snapshots_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "crawl_page_snapshots_property_url_created_idx"
  ON "crawl_page_snapshots" ("property_id","canonical_url","created_at");
CREATE INDEX IF NOT EXISTS "crawl_page_snapshots_property_fingerprint_idx"
  ON "crawl_page_snapshots" ("property_id","seo_fingerprint_hash");
CREATE INDEX IF NOT EXISTS "crawl_page_snapshots_report_idx"
  ON "crawl_page_snapshots" ("report_id","created_at");

CREATE TABLE IF NOT EXISTS "property_page_registry" (
  "id" text PRIMARY KEY NOT NULL,
  "property_id" text NOT NULL,
  "team_id" text NOT NULL,
  "canonical_url" text NOT NULL,
  "current_fingerprint_hash" text NOT NULL,
  "current_snapshot_id" text,
  "first_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_changed_at" timestamp,
  "last_report_id" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "property_page_registry"
  ADD CONSTRAINT "property_page_registry_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_page_registry"
  ADD CONSTRAINT "property_page_registry_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_page_registry"
  ADD CONSTRAINT "property_page_registry_current_snapshot_id_crawl_page_snapshots_id_fk"
  FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."crawl_page_snapshots"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "property_page_registry"
  ADD CONSTRAINT "property_page_registry_last_report_id_reports_id_fk"
  FOREIGN KEY ("last_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "property_page_registry_property_url_unique"
  ON "property_page_registry" ("property_id","canonical_url");
CREATE INDEX IF NOT EXISTS "property_page_registry_property_active_idx"
  ON "property_page_registry" ("property_id","is_active","last_seen_at");

-- OpenAI daily billed costs reconciliation table
CREATE TABLE IF NOT EXISTS "openai_daily_costs" (
  "id" text PRIMARY KEY NOT NULL,
  "source_date" date NOT NULL,
  "project_id" text,
  "line_item" text,
  "amount_usd" numeric(14,6) NOT NULL,
  "currency" text DEFAULT 'usd' NOT NULL,
  "raw_bucket" jsonb NOT NULL,
  "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "openai_daily_costs_source_project_line_unique"
  ON "openai_daily_costs" ("source_date","project_id","line_item");
CREATE INDEX IF NOT EXISTS "openai_daily_costs_source_date_idx"
  ON "openai_daily_costs" ("source_date");
CREATE INDEX IF NOT EXISTS "openai_daily_costs_project_date_idx"
  ON "openai_daily_costs" ("project_id","source_date");
