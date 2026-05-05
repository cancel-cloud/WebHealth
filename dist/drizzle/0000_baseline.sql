CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE TABLE "admin_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_emails_email_unique" UNIQUE("email")
);

CREATE TABLE "ai_report_prompt_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"template" text NOT NULL,
	"examples" text,
	"schema_version" text DEFAULT 'v1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_report_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"output_strategy" text DEFAULT 'json_schema' NOT NULL,
	"temperature" numeric(4, 2) DEFAULT '0.2' NOT NULL,
	"max_output_tokens" integer DEFAULT 6000 NOT NULL,
	"input_token_budget" integer DEFAULT 90000 NOT NULL,
	"language" text DEFAULT 'de' NOT NULL,
	"service_tier" text DEFAULT 'default' NOT NULL,
	"use_background_mode" boolean DEFAULT true NOT NULL,
	"use_prompt_caching" boolean DEFAULT true NOT NULL,
	"use_strict_schema" boolean DEFAULT true NOT NULL,
	"schema_version" text DEFAULT 'v1' NOT NULL,
	"prompt_version_id" text,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "crawl_page_snapshots" (
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

CREATE TABLE "crawls" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"property_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"pages_crawled" integer DEFAULT 0 NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled_globally" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);

CREATE TABLE "feedback_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text,
	"user_name_snapshot" text NOT NULL,
	"email_snapshot" text NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"resolved_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ga4_daily_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"gsc_property_id" text,
	"ga4_property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"raw_version" text DEFAULT 'v1' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ga4_daily_facts_ga4_property_id_source_date_unique" UNIQUE("ga4_property_id","source_date")
);

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

CREATE TABLE "gsc_daily_raw" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"source_date" date NOT NULL,
	"site_url" text NOT NULL,
	"summary_payload" jsonb NOT NULL,
	"queries_payload" jsonb,
	"pages_payload" jsonb,
	"countries_payload" jsonb,
	"devices_payload" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sync_job_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gsc_daily_raw_property_id_source_date_unique" UNIQUE("property_id","source_date")
);

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

CREATE TABLE "openai_daily_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_date" date NOT NULL,
	"project_id" text,
	"line_item" text,
	"amount_usd" numeric(14, 6) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"raw_bucket" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "openai_daily_costs_source_date_project_id_line_item_unique" UNIQUE("source_date","project_id","line_item")
);

CREATE TABLE "plan_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"display_name" text NOT NULL,
	"reports_per_month" integer,
	"max_properties" integer,
	"details_per_month" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_settings_tier_unique" UNIQUE("tier")
);

CREATE TABLE "product_events" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"properties" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"ga4_property_id" text,
	"gsc_data_start_date" date,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

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

CREATE TABLE "property_page_registry" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_page_registry_property_id_canonical_url_unique" UNIQUE("property_id","canonical_url")
);

CREATE TABLE "property_weekly_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_weekly_reviews_team_id_property_id_unique" UNIQUE("team_id","property_id")
);

CREATE TABLE "report_detail_ai_expansions" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"team_id" text NOT NULL,
	"requested_by_user_id" text,
	"request_number" integer NOT NULL,
	"kind" text NOT NULL,
	"row_id" text NOT NULL,
	"model" text,
	"usage" jsonb,
	"estimated_cost_usd" numeric(12, 6),
	"x_request_id" text,
	"x_client_request_id" text,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_detail_ai_expansions_report_id_request_number_unique" UNIQUE("report_id","request_number")
);

CREATE TABLE "report_job_events" (
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

CREATE TABLE "report_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"team_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"phase" text DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 2 NOT NULL,
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

CREATE TABLE "report_recommendation_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"user_id" text,
	"feedback_type" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_recommendation_feedback_report_id_recommendation_id_unique" UNIQUE("report_id","recommendation_id")
);

CREATE TABLE "report_recommendation_states" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_recommendation_states_report_id_recommendation_id_unique" UNIQUE("report_id","recommendation_id")
);

CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"date_range_start" date NOT NULL,
	"date_range_end" date NOT NULL,
	"compare_range_start" date NOT NULL,
	"compare_range_end" date NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"data" jsonb,
	"quick_wins" jsonb,
	"ai_status" text DEFAULT 'queued',
	"ai_report_json" jsonb,
	"ai_report_markdown" text,
	"ai_input_snapshot_sanitized" jsonb,
	"ai_model" text,
	"ai_output_strategy" text,
	"ai_prompt_version_id" text,
	"ai_prompt_snapshot" text,
	"openai_response_id" text,
	"ai_usage" jsonb,
	"ai_estimated_cost_usd" numeric(12, 6),
	"details_cost_usd" numeric(12, 6),
	"details_request_count" integer DEFAULT 0 NOT NULL,
	"openai_request_ids" jsonb,
	"site_changes" jsonb,
	"source" text DEFAULT 'manual' NOT NULL,
	"auto_run_key" text,
	"weekly_review_findings" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"triggered_by" text NOT NULL,
	"target_user_id" text,
	"status" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "team_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"year_month" text NOT NULL,
	"details_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "team_usage_team_id_year_month_unique" UNIQUE("team_id","year_month")
);

CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_cancel_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"restriction_message" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "user_feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_id" text NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feature_flags_flag_id_user_id_unique" UNIQUE("flag_id","user_id")
);

CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weekly_digest" boolean DEFAULT false NOT NULL,
	"report_complete" boolean DEFAULT true NOT NULL,
	"sync_failure" boolean DEFAULT true NOT NULL,
	"email_receipts" boolean DEFAULT true NOT NULL,
	"report_language" text DEFAULT 'auto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);

CREATE TABLE "weekly_review_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"report_id" text,
	"run_key" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"skip_reason" text,
	"date_range_start" date NOT NULL,
	"date_range_end" date NOT NULL,
	"compare_range_start" date NOT NULL,
	"compare_range_end" date NOT NULL,
	"actionable_count" integer DEFAULT 0 NOT NULL,
	"notification_seen_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_review_runs_team_id_property_id_run_key_unique" UNIQUE("team_id","property_id","run_key")
);

ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "admin_emails" ADD CONSTRAINT "admin_emails_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_report_prompt_versions" ADD CONSTRAINT "ai_report_prompt_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_report_settings" ADD CONSTRAINT "ai_report_settings_prompt_version_id_ai_report_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."ai_report_prompt_versions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_report_settings" ADD CONSTRAINT "ai_report_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots" ADD CONSTRAINT "crawl_page_snapshots_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots" ADD CONSTRAINT "crawl_page_snapshots_crawl_id_crawls_id_fk" FOREIGN KEY ("crawl_id") REFERENCES "public"."crawls"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots" ADD CONSTRAINT "crawl_page_snapshots_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawl_page_snapshots" ADD CONSTRAINT "crawl_page_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawls" ADD CONSTRAINT "crawls_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "crawls" ADD CONSTRAINT "crawls_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_property_id_properties_id_fk" FOREIGN KEY ("target_property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "properties" ADD CONSTRAINT "properties_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_current_snapshot_id_crawl_page_snapshots_id_fk" FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."crawl_page_snapshots"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_last_report_id_reports_id_fk" FOREIGN KEY ("last_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_weekly_reviews" ADD CONSTRAINT "property_weekly_reviews_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "report_detail_ai_expansions" ADD CONSTRAINT "report_detail_ai_expansions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_detail_ai_expansions" ADD CONSTRAINT "report_detail_ai_expansions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_detail_ai_expansions" ADD CONSTRAINT "report_detail_ai_expansions_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "report_job_events" ADD CONSTRAINT "report_job_events_job_id_report_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."report_jobs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_job_events" ADD CONSTRAINT "report_job_events_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_job_events" ADD CONSTRAINT "report_job_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_recommendation_feedback" ADD CONSTRAINT "report_recommendation_feedback_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "report_recommendation_feedback" ADD CONSTRAINT "report_recommendation_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "report_recommendation_states" ADD CONSTRAINT "report_recommendation_states_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reports" ADD CONSTRAINT "reports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reports" ADD CONSTRAINT "reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_triggered_by_user_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_usage" ADD CONSTRAINT "team_usage_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "weekly_review_runs" ADD CONSTRAINT "weekly_review_runs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "crawl_page_snapshots_property_url_created_idx" ON "crawl_page_snapshots" USING btree ("property_id","canonical_url","created_at");
CREATE INDEX "crawl_page_snapshots_property_fingerprint_idx" ON "crawl_page_snapshots" USING btree ("property_id","seo_fingerprint_hash");
CREATE INDEX "crawl_page_snapshots_report_idx" ON "crawl_page_snapshots" USING btree ("report_id","created_at");
CREATE INDEX "feedback_submissions_status_created_idx" ON "feedback_submissions" USING btree ("status","created_at");
CREATE INDEX "feedback_submissions_team_created_idx" ON "feedback_submissions" USING btree ("team_id","created_at");
CREATE INDEX "feedback_submissions_user_created_idx" ON "feedback_submissions" USING btree ("user_id","created_at");
CREATE INDEX "ga4_daily_facts_gsc_date_idx" ON "ga4_daily_facts" USING btree ("gsc_property_id","source_date");
CREATE INDEX "ga4_daily_facts_team_date_idx" ON "ga4_daily_facts" USING btree ("team_id","source_date");
CREATE INDEX "ga4_daily_raw_gsc_date_idx" ON "ga4_daily_raw" USING btree ("gsc_property_id","source_date");
CREATE INDEX "ga4_daily_raw_team_date_idx" ON "ga4_daily_raw" USING btree ("team_id","source_date");
CREATE INDEX "gsc_daily_facts_team_date_idx" ON "gsc_daily_facts" USING btree ("team_id","source_date");
CREATE INDEX "gsc_daily_raw_team_date_idx" ON "gsc_daily_raw" USING btree ("team_id","source_date");
CREATE INDEX "gsc_daily_raw_property_fetched_idx" ON "gsc_daily_raw" USING btree ("property_id","fetched_at");
CREATE INDEX "metrics_backfill_jobs_team_status_idx" ON "metrics_backfill_jobs" USING btree ("team_id","status","created_at");
CREATE INDEX "metrics_backfill_jobs_property_created_idx" ON "metrics_backfill_jobs" USING btree ("target_property_id","created_at");
CREATE INDEX "openai_daily_costs_source_date_idx" ON "openai_daily_costs" USING btree ("source_date");
CREATE INDEX "openai_daily_costs_project_date_idx" ON "openai_daily_costs" USING btree ("project_id","source_date");
CREATE INDEX "product_events_team_created_idx" ON "product_events" USING btree ("team_id","created_at");
CREATE INDEX "product_events_name_created_idx" ON "product_events" USING btree ("name","created_at");
CREATE INDEX "product_events_user_created_idx" ON "product_events" USING btree ("user_id","created_at");
CREATE INDEX "property_daily_ai_summaries_team_property_date_idx" ON "property_daily_ai_summaries" USING btree ("team_id","property_id","source_date");
CREATE INDEX "property_page_registry_property_active_idx" ON "property_page_registry" USING btree ("property_id","is_active","last_seen_at");
CREATE INDEX "property_weekly_reviews_team_enabled_idx" ON "property_weekly_reviews" USING btree ("team_id","enabled");
CREATE INDEX "report_detail_ai_expansions_report_created_idx" ON "report_detail_ai_expansions" USING btree ("report_id","created_at");
CREATE INDEX "report_detail_ai_expansions_team_created_idx" ON "report_detail_ai_expansions" USING btree ("team_id","created_at");
CREATE INDEX "report_detail_ai_expansions_user_created_idx" ON "report_detail_ai_expansions" USING btree ("requested_by_user_id","created_at");
CREATE INDEX "report_job_events_job_created_idx" ON "report_job_events" USING btree ("job_id","created_at");
CREATE INDEX "report_job_events_report_created_idx" ON "report_job_events" USING btree ("report_id","created_at");
CREATE INDEX "report_job_events_team_created_idx" ON "report_job_events" USING btree ("team_id","created_at");
CREATE INDEX "report_jobs_status_available_idx" ON "report_jobs" USING btree ("status","available_at","priority","created_at");
CREATE INDEX "report_jobs_team_status_claim_idx" ON "report_jobs" USING btree ("team_id","status","claim_expires_at");
CREATE INDEX "report_jobs_report_kind_status_idx" ON "report_jobs" USING btree ("report_id","kind","status");
CREATE INDEX "report_recommendation_feedback_report_type_idx" ON "report_recommendation_feedback" USING btree ("report_id","feedback_type","updated_at");
CREATE INDEX "report_recommendation_states_report_state_idx" ON "report_recommendation_states" USING btree ("report_id","state","updated_at");
CREATE INDEX "weekly_review_runs_team_created_idx" ON "weekly_review_runs" USING btree ("team_id","created_at");
CREATE INDEX "weekly_review_runs_report_idx" ON "weekly_review_runs" USING btree ("report_id");
CREATE INDEX "weekly_review_runs_status_created_idx" ON "weekly_review_runs" USING btree ("status","created_at");
