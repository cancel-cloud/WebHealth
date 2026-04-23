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
	"state" text DEFAULT 'open' NOT NULL,
	"snoozed_until" date,
	"last_evaluated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "action_items_property_id_fingerprint_unique" UNIQUE("property_id","fingerprint")
);

CREATE TABLE "action_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"action_item_id" text NOT NULL,
	"user_id" text,
	"feedback_type" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

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

ALTER TABLE "action_items" ADD CONSTRAINT "action_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "action_feedback" ADD CONSTRAINT "action_feedback_action_item_id_action_items_id_fk" FOREIGN KEY ("action_item_id") REFERENCES "public"."action_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "action_feedback" ADD CONSTRAINT "action_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "analysis_window_cache" ADD CONSTRAINT "analysis_window_cache_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "analysis_window_cache" ADD CONSTRAINT "analysis_window_cache_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "snapshot_exports" ADD CONSTRAINT "snapshot_exports_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "action_items_property_state_idx" ON "action_items" USING btree ("property_id","state","updated_at");
CREATE INDEX "action_items_team_property_updated_idx" ON "action_items" USING btree ("team_id","property_id","updated_at");
CREATE INDEX "action_feedback_item_created_idx" ON "action_feedback" USING btree ("action_item_id","created_at");
CREATE INDEX "action_feedback_user_created_idx" ON "action_feedback" USING btree ("user_id","created_at");
CREATE INDEX "analysis_window_cache_property_expiry_idx" ON "analysis_window_cache" USING btree ("property_id","expires_at","updated_at");
CREATE INDEX "analysis_window_cache_team_property_idx" ON "analysis_window_cache" USING btree ("team_id","property_id","updated_at");
CREATE INDEX "snapshot_exports_property_created_idx" ON "snapshot_exports" USING btree ("property_id","created_at");
CREATE INDEX "snapshot_exports_team_created_idx" ON "snapshot_exports" USING btree ("team_id","created_at");
