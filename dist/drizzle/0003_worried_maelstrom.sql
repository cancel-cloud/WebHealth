CREATE TABLE "ga4_daily_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"gsc_property_id" text,
	"ga4_property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"raw_version" text DEFAULT 'v1' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ga4_daily_facts_ga4_property_id_source_date_unique" UNIQUE("ga4_property_id","source_date")
);
--> statement-breakpoint
CREATE TABLE "ga4_daily_raw" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"gsc_property_id" text,
	"ga4_property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"run_report_payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sync_job_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ga4_daily_raw_ga4_property_id_source_date_unique" UNIQUE("ga4_property_id","source_date")
);
--> statement-breakpoint
CREATE TABLE "gsc_daily_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"ctr" text DEFAULT '0' NOT NULL,
	"position" text DEFAULT '0' NOT NULL,
	"query_count" integer DEFAULT 0 NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"raw_version" text DEFAULT 'v1' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gsc_daily_facts_property_id_source_date_unique" UNIQUE("property_id","source_date")
);
--> statement-breakpoint
CREATE TABLE "gsc_daily_raw" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"site_url" text NOT NULL,
	"summary_payload" jsonb NOT NULL,
	"queries_payload" jsonb,
	"pages_payload" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sync_job_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gsc_daily_raw_property_id_source_date_unique" UNIQUE("property_id","source_date")
);
--> statement-breakpoint
CREATE TABLE "metrics_backfill_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"triggered_by_user_id" text NOT NULL,
	"target_property_id" text,
	"target_user_id" text,
	"include_gsc" boolean DEFAULT true NOT NULL,
	"include_ga4" boolean DEFAULT true NOT NULL,
	"timeframe_mode" text DEFAULT 'custom' NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date NOT NULL,
	"refresh_recent_days" integer DEFAULT 7 NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"totals" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "plan_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"display_name" text NOT NULL,
	"reports_per_month" integer,
	"max_properties" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_settings_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "property_daily_ai_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"has_gsc" boolean DEFAULT false NOT NULL,
	"has_ga4" boolean DEFAULT false NOT NULL,
	"model" text,
	"input_version" text DEFAULT 'v1' NOT NULL,
	"summary_json" jsonb,
	"summary_text" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_daily_ai_summaries_property_id_source_date_unique" UNIQUE("property_id","source_date")
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_restricted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "restriction_message" text;--> statement-breakpoint
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_property_id_properties_id_fk" FOREIGN KEY ("target_property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ga4_daily_facts_gsc_date_idx" ON "ga4_daily_facts" USING btree ("gsc_property_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_facts_team_date_idx" ON "ga4_daily_facts" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_raw_gsc_date_idx" ON "ga4_daily_raw" USING btree ("gsc_property_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_raw_team_date_idx" ON "ga4_daily_raw" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "gsc_daily_facts_team_date_idx" ON "gsc_daily_facts" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "gsc_daily_raw_team_date_idx" ON "gsc_daily_raw" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "gsc_daily_raw_property_fetched_idx" ON "gsc_daily_raw" USING btree ("property_id","fetched_at");--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_team_status_idx" ON "metrics_backfill_jobs" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_property_created_idx" ON "metrics_backfill_jobs" USING btree ("target_property_id","created_at");--> statement-breakpoint
CREATE INDEX "property_daily_ai_summaries_team_property_date_idx" ON "property_daily_ai_summaries" USING btree ("team_id","property_id","source_date");