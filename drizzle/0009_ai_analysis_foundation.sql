CREATE TABLE "ai_prompt_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "purpose" text NOT NULL,
  "version" integer NOT NULL,
  "name" text NOT NULL,
  "system_prompt" text NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "created_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_prompt_templates_purpose_version_unique" UNIQUE("purpose","version")
);

ALTER TABLE "ai_prompt_templates"
  ADD CONSTRAINT "ai_prompt_templates_created_by_user_id_user_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "ai_prompt_templates_purpose_active_idx" ON "ai_prompt_templates" USING btree ("purpose","is_active");

CREATE TABLE "ai_analysis_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "refresh_job_id" text,
  "preset" text NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "compare_mode" text NOT NULL,
  "compare_start_date" date,
  "compare_end_date" date,
  "source_version_hash" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "phase" text DEFAULT 'queued' NOT NULL,
  "summary_model" text,
  "analyzer_model" text,
  "prompt_versions" jsonb NOT NULL,
  "source_summary_input" jsonb,
  "source_summaries" jsonb,
  "analyzer_output" jsonb,
  "usage_snapshot" jsonb,
  "cost_estimate_usd" numeric(14, 6),
  "error" text,
  "started_at" timestamp,
  "finished_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_analysis_runs_property_window_source_unique" UNIQUE("property_id","start_date","end_date","compare_mode","compare_start_date","compare_end_date","source_version_hash")
);

ALTER TABLE "ai_analysis_runs"
  ADD CONSTRAINT "ai_analysis_runs_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_analysis_runs"
  ADD CONSTRAINT "ai_analysis_runs_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_analysis_runs"
  ADD CONSTRAINT "ai_analysis_runs_refresh_job_id_property_refresh_jobs_id_fk"
  FOREIGN KEY ("refresh_job_id") REFERENCES "public"."property_refresh_jobs"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "ai_analysis_runs_property_status_idx" ON "ai_analysis_runs" USING btree ("property_id","status","updated_at");
CREATE INDEX "ai_analysis_runs_team_created_idx" ON "ai_analysis_runs" USING btree ("team_id","created_at");

CREATE TABLE "ai_recommendations" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "property_id" text NOT NULL,
  "ai_run_id" text NOT NULL,
  "action_item_id" text,
  "fingerprint" text NOT NULL,
  "source" text DEFAULT 'ai' NOT NULL,
  "title" text NOT NULL,
  "area" text NOT NULL,
  "target_type" text NOT NULL,
  "target_key" text NOT NULL,
  "confidence" text NOT NULL,
  "summary" text NOT NULL,
  "client_safe_summary" text NOT NULL,
  "evidence_anchors" jsonb NOT NULL,
  "raw_recommendation" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_recommendations_run_fingerprint_unique" UNIQUE("ai_run_id","fingerprint")
);

ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_ai_run_id_ai_analysis_runs_id_fk"
  FOREIGN KEY ("ai_run_id") REFERENCES "public"."ai_analysis_runs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_action_item_id_action_items_id_fk"
  FOREIGN KEY ("action_item_id") REFERENCES "public"."action_items"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "ai_recommendations_property_created_idx" ON "ai_recommendations" USING btree ("property_id","created_at");
CREATE INDEX "ai_recommendations_team_created_idx" ON "ai_recommendations" USING btree ("team_id","created_at");
CREATE INDEX "ai_recommendations_action_item_idx" ON "ai_recommendations" USING btree ("action_item_id");
