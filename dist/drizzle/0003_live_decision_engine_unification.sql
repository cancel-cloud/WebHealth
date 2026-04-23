ALTER TABLE "action_items"
  ADD COLUMN "system_rank" integer,
  ADD COLUMN "system_score" integer,
  ADD COLUMN "priority_override" text DEFAULT 'none' NOT NULL,
  ADD COLUMN "override_reason" text,
  ADD COLUMN "override_updated_by_user_id" text,
  ADD COLUMN "override_updated_at" timestamp;

ALTER TABLE "action_items"
  ADD CONSTRAINT "action_items_override_updated_by_user_id_user_id_fk"
  FOREIGN KEY ("override_updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "action_items_team_rank_idx" ON "action_items" USING btree ("team_id","system_rank","updated_at");

CREATE TABLE "property_refresh_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "triggered_by_user_id" text,
  "job_type" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "phase" text DEFAULT 'queued' NOT NULL,
  "message" text,
  "progress_meta" jsonb,
  "payload" jsonb,
  "last_error" text,
  "available_at" timestamp DEFAULT now() NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 2 NOT NULL,
  "claimed_by" text,
  "claimed_at" timestamp,
  "claim_expires_at" timestamp,
  "heartbeat_at" timestamp,
  "started_at" timestamp,
  "finished_at" timestamp,
  "superseded_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "property_refresh_jobs"
  ADD CONSTRAINT "property_refresh_jobs_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_refresh_jobs"
  ADD CONSTRAINT "property_refresh_jobs_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_refresh_jobs"
  ADD CONSTRAINT "property_refresh_jobs_triggered_by_user_id_user_id_fk"
  FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "property_refresh_jobs_team_property_idx" ON "property_refresh_jobs" USING btree ("team_id","property_id","created_at");
CREATE INDEX "property_refresh_jobs_status_available_idx" ON "property_refresh_jobs" USING btree ("status","available_at","created_at");
CREATE INDEX "property_refresh_jobs_property_status_idx" ON "property_refresh_jobs" USING btree ("property_id","status","updated_at");

CREATE TABLE "property_crawl_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "refresh_job_id" text,
  "source" text DEFAULT 'property_refresh' NOT NULL,
  "crawl_data" jsonb NOT NULL,
  "page_count" integer DEFAULT 0 NOT NULL,
  "fingerprint" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "property_crawl_snapshots"
  ADD CONSTRAINT "property_crawl_snapshots_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_crawl_snapshots"
  ADD CONSTRAINT "property_crawl_snapshots_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_crawl_snapshots"
  ADD CONSTRAINT "property_crawl_snapshots_refresh_job_id_property_refresh_jobs_id_fk"
  FOREIGN KEY ("refresh_job_id") REFERENCES "public"."property_refresh_jobs"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "property_crawl_snapshots_property_created_idx" ON "property_crawl_snapshots" USING btree ("property_id","created_at");
CREATE INDEX "property_crawl_snapshots_refresh_idx" ON "property_crawl_snapshots" USING btree ("refresh_job_id");
