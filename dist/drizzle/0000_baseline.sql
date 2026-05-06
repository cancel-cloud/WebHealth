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
--> statement-breakpoint
CREATE TABLE "action_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"action_item_id" text NOT NULL,
	"user_id" text,
	"feedback_type" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"action_family" text NOT NULL,
	"cause_family" text NOT NULL,
	"remedy_key" text NOT NULL,
	"target_type" text NOT NULL,
	"target_key" text NOT NULL,
	"title" text NOT NULL,
	"owner" text,
	"assignee_user_id" text,
	"assignee_email" text,
	"state" text DEFAULT 'open' NOT NULL,
	"system_rank" integer,
	"system_score" integer,
	"priority_override" text DEFAULT 'none' NOT NULL,
	"override_reason" text,
	"override_updated_by_user_id" text,
	"override_updated_at" timestamp,
	"snoozed_until" date,
	"last_evaluated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "action_items_property_id_fingerprint_unique" UNIQUE("property_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "admin_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
	CONSTRAINT "ai_analysis_runs_property_id_start_date_end_date_compare_mode_compare_start_date_compare_end_date_source_version_hash_unique" UNIQUE("property_id","start_date","end_date","compare_mode","compare_start_date","compare_end_date","source_version_hash")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
	CONSTRAINT "ai_recommendations_ai_run_id_fingerprint_unique" UNIQUE("ai_run_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "ai_runtime_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"summary_model" text DEFAULT 'gpt-5-mini' NOT NULL,
	"analyzer_model" text DEFAULT 'gpt-5-mini' NOT NULL,
	"max_output_tokens" integer DEFAULT 128000 NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_window_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"preset" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"compare_mode" text NOT NULL,
	"compare_start_date" date,
	"compare_end_date" date,
	"requested_end_date" date NOT NULL,
	"source_version_hash" text NOT NULL,
	"freshness_state" text DEFAULT 'complete' NOT NULL,
	"freshness_summary" jsonb,
	"resolved_payload" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_window_cache_property_id_start_date_end_date_compare_mode_compare_start_date_compare_end_date_source_version_hash_unique" UNIQUE("property_id","start_date","end_date","compare_mode","compare_start_date","compare_end_date","source_version_hash")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled_globally" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
CREATE TABLE "ga4_report_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"gsc_property_id" text,
	"ga4_property_id" text NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date NOT NULL,
	"report_payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sync_job_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ga4_report_artifacts_ga4_property_id_date_start_date_end_unique" UNIQUE("ga4_property_id","date_start","date_end")
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
	"query_page_pairs_payload" jsonb,
	"countries_payload" jsonb,
	"devices_payload" jsonb,
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
	"trigger_source" text DEFAULT 'manual' NOT NULL,
	"totals" jsonb,
	"error" text,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 2 NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp,
	"claim_expires_at" timestamp,
	"heartbeat_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "plan_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"display_name" text NOT NULL,
	"max_properties" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_settings_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"ga4_property_id" text,
	"ga4_link_confidence" text,
	"ga4_link_source" text,
	"ga4_link_updated_at" timestamp,
	"gsc_data_start_date" date,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_page_registry_property_id_canonical_url_unique" UNIQUE("property_id","canonical_url")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "property_setup_dismissals" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"dismissed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_setup_dismissals_user_id_property_id_unique" UNIQUE("user_id","property_id")
);
--> statement-breakpoint
CREATE TABLE "property_share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"token" text NOT NULL,
	"created_by_user_id" text,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"window_preset" text NOT NULL,
	"compare_mode" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"brand_snapshot" jsonb NOT NULL,
	"payload_snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "snapshot_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"created_by_user_id" text,
	"preset" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"compare_mode" text NOT NULL,
	"compare_start_date" date,
	"compare_end_date" date,
	"requested_end_date" date NOT NULL,
	"freshness_state" text DEFAULT 'complete' NOT NULL,
	"freshness_summary" jsonb,
	"branding_snapshot" jsonb,
	"dashboard_payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"triggered_by" text NOT NULL,
	"target_user_id" text,
	"status" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_branding_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"agency_name" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"website_url" text,
	"logo_url" text,
	"icon_url" text,
	"primary_color" text,
	"accent_color" text,
	"footer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_branding_profiles_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
	"onboarding_completed_at" timestamp,
	"onboarding_completion_reason" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_id" text NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feature_flags_flag_id_user_id_unique" UNIQUE("flag_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weekly_digest" boolean DEFAULT false NOT NULL,
	"sync_failure" boolean DEFAULT true NOT NULL,
	"email_receipts" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_feedback" ADD CONSTRAINT "action_feedback_action_item_id_action_items_id_fk" FOREIGN KEY ("action_item_id") REFERENCES "public"."action_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_feedback" ADD CONSTRAINT "action_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_override_updated_by_user_id_user_id_fk" FOREIGN KEY ("override_updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_emails" ADD CONSTRAINT "admin_emails_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_runs" ADD CONSTRAINT "ai_analysis_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_runs" ADD CONSTRAINT "ai_analysis_runs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_runs" ADD CONSTRAINT "ai_analysis_runs_refresh_job_id_property_refresh_jobs_id_fk" FOREIGN KEY ("refresh_job_id") REFERENCES "public"."property_refresh_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_ai_run_id_ai_analysis_runs_id_fk" FOREIGN KEY ("ai_run_id") REFERENCES "public"."ai_analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_action_item_id_action_items_id_fk" FOREIGN KEY ("action_item_id") REFERENCES "public"."action_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runtime_settings" ADD CONSTRAINT "ai_runtime_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_window_cache" ADD CONSTRAINT "analysis_window_cache_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_window_cache" ADD CONSTRAINT "analysis_window_cache_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_facts" ADD CONSTRAINT "ga4_daily_facts_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_daily_raw" ADD CONSTRAINT "ga4_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_gsc_property_id_properties_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga4_report_artifacts" ADD CONSTRAINT "ga4_report_artifacts_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_facts" ADD CONSTRAINT "gsc_daily_facts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_daily_raw" ADD CONSTRAINT "gsc_daily_raw_sync_job_id_metrics_backfill_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."metrics_backfill_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_property_id_properties_id_fk" FOREIGN KEY ("target_property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_backfill_jobs" ADD CONSTRAINT "metrics_backfill_jobs_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_crawl_snapshots" ADD CONSTRAINT "property_crawl_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_crawl_snapshots" ADD CONSTRAINT "property_crawl_snapshots_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_crawl_snapshots" ADD CONSTRAINT "property_crawl_snapshots_refresh_job_id_property_refresh_jobs_id_fk" FOREIGN KEY ("refresh_job_id") REFERENCES "public"."property_refresh_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_daily_ai_summaries" ADD CONSTRAINT "property_daily_ai_summaries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_page_registry" ADD CONSTRAINT "property_page_registry_current_snapshot_id_property_crawl_snapshots_id_fk" FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."property_crawl_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_refresh_jobs" ADD CONSTRAINT "property_refresh_jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_refresh_jobs" ADD CONSTRAINT "property_refresh_jobs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_refresh_jobs" ADD CONSTRAINT "property_refresh_jobs_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_share_links" ADD CONSTRAINT "property_share_links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_share_links" ADD CONSTRAINT "property_share_links_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_share_links" ADD CONSTRAINT "property_share_links_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_triggered_by_user_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_branding_profiles" ADD CONSTRAINT "team_branding_profiles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_feedback_item_created_idx" ON "action_feedback" USING btree ("action_item_id","created_at");--> statement-breakpoint
CREATE INDEX "action_feedback_user_created_idx" ON "action_feedback" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "action_items_property_state_idx" ON "action_items" USING btree ("property_id","state","updated_at");--> statement-breakpoint
CREATE INDEX "action_items_team_property_updated_idx" ON "action_items" USING btree ("team_id","property_id","updated_at");--> statement-breakpoint
CREATE INDEX "action_items_team_rank_idx" ON "action_items" USING btree ("team_id","system_rank","updated_at");--> statement-breakpoint
CREATE INDEX "ai_analysis_runs_property_status_idx" ON "ai_analysis_runs" USING btree ("property_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "ai_analysis_runs_team_created_idx" ON "ai_analysis_runs" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_prompt_templates_purpose_active_idx" ON "ai_prompt_templates" USING btree ("purpose","is_active");--> statement-breakpoint
CREATE INDEX "ai_recommendations_property_created_idx" ON "ai_recommendations" USING btree ("property_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_recommendations_team_created_idx" ON "ai_recommendations" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_recommendations_action_item_idx" ON "ai_recommendations" USING btree ("action_item_id");--> statement-breakpoint
CREATE INDEX "analysis_window_cache_property_expiry_idx" ON "analysis_window_cache" USING btree ("property_id","expires_at","updated_at");--> statement-breakpoint
CREATE INDEX "analysis_window_cache_team_property_idx" ON "analysis_window_cache" USING btree ("team_id","property_id","updated_at");--> statement-breakpoint
CREATE INDEX "feedback_submissions_status_created_idx" ON "feedback_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "feedback_submissions_team_created_idx" ON "feedback_submissions" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_submissions_user_created_idx" ON "feedback_submissions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ga4_daily_facts_gsc_date_idx" ON "ga4_daily_facts" USING btree ("gsc_property_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_facts_team_date_idx" ON "ga4_daily_facts" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_raw_gsc_date_idx" ON "ga4_daily_raw" USING btree ("gsc_property_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_daily_raw_team_date_idx" ON "ga4_daily_raw" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "ga4_report_artifacts_gsc_range_idx" ON "ga4_report_artifacts" USING btree ("gsc_property_id","date_start","date_end");--> statement-breakpoint
CREATE INDEX "ga4_report_artifacts_team_fetched_idx" ON "ga4_report_artifacts" USING btree ("team_id","fetched_at");--> statement-breakpoint
CREATE INDEX "gsc_daily_facts_team_date_idx" ON "gsc_daily_facts" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "gsc_daily_raw_team_date_idx" ON "gsc_daily_raw" USING btree ("team_id","source_date");--> statement-breakpoint
CREATE INDEX "gsc_daily_raw_property_fetched_idx" ON "gsc_daily_raw" USING btree ("property_id","fetched_at");--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_team_status_idx" ON "metrics_backfill_jobs" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_property_created_idx" ON "metrics_backfill_jobs" USING btree ("target_property_id","created_at");--> statement-breakpoint
CREATE INDEX "metrics_backfill_jobs_status_available_idx" ON "metrics_backfill_jobs" USING btree ("status","available_at","created_at");--> statement-breakpoint
CREATE INDEX "openai_daily_costs_source_date_idx" ON "openai_daily_costs" USING btree ("source_date");--> statement-breakpoint
CREATE INDEX "openai_daily_costs_project_date_idx" ON "openai_daily_costs" USING btree ("project_id","source_date");--> statement-breakpoint
CREATE INDEX "product_events_team_created_idx" ON "product_events" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "product_events_name_created_idx" ON "product_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "product_events_user_created_idx" ON "product_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "property_crawl_snapshots_property_created_idx" ON "property_crawl_snapshots" USING btree ("property_id","created_at");--> statement-breakpoint
CREATE INDEX "property_crawl_snapshots_refresh_idx" ON "property_crawl_snapshots" USING btree ("refresh_job_id");--> statement-breakpoint
CREATE INDEX "property_daily_ai_summaries_team_property_date_idx" ON "property_daily_ai_summaries" USING btree ("team_id","property_id","source_date");--> statement-breakpoint
CREATE INDEX "property_page_registry_property_active_idx" ON "property_page_registry" USING btree ("property_id","is_active","last_seen_at");--> statement-breakpoint
CREATE INDEX "property_refresh_jobs_team_property_idx" ON "property_refresh_jobs" USING btree ("team_id","property_id","created_at");--> statement-breakpoint
CREATE INDEX "property_refresh_jobs_status_available_idx" ON "property_refresh_jobs" USING btree ("status","available_at","created_at");--> statement-breakpoint
CREATE INDEX "property_refresh_jobs_property_status_idx" ON "property_refresh_jobs" USING btree ("property_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "property_setup_dismissals_team_property_idx" ON "property_setup_dismissals" USING btree ("team_id","property_id");--> statement-breakpoint
CREATE INDEX "property_share_links_token_idx" ON "property_share_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "property_share_links_property_created_idx" ON "property_share_links" USING btree ("property_id","created_at");--> statement-breakpoint
CREATE INDEX "property_share_links_team_created_idx" ON "property_share_links" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "snapshot_exports_property_created_idx" ON "snapshot_exports" USING btree ("property_id","created_at");--> statement-breakpoint
CREATE INDEX "snapshot_exports_team_created_idx" ON "snapshot_exports" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "team_branding_profiles_team_updated_idx" ON "team_branding_profiles" USING btree ("team_id","updated_at");
