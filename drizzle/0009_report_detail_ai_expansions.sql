ALTER TABLE "reports"
ADD COLUMN IF NOT EXISTS "details_cost_usd" numeric(12, 6);

ALTER TABLE "reports"
ADD COLUMN IF NOT EXISTS "details_request_count" integer DEFAULT 0 NOT NULL;

CREATE TABLE IF NOT EXISTS "report_detail_ai_expansions" (
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
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "report_detail_ai_expansions"
  ADD CONSTRAINT "report_detail_ai_expansions_report_id_reports_id_fk"
  FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "report_detail_ai_expansions"
  ADD CONSTRAINT "report_detail_ai_expansions_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "report_detail_ai_expansions"
  ADD CONSTRAINT "report_detail_ai_expansions_requested_by_user_id_user_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "report_detail_ai_expansions_report_request_number_unique"
  ON "report_detail_ai_expansions" ("report_id", "request_number");

CREATE INDEX IF NOT EXISTS "report_detail_ai_expansions_report_created_idx"
  ON "report_detail_ai_expansions" ("report_id", "created_at");

CREATE INDEX IF NOT EXISTS "report_detail_ai_expansions_team_created_idx"
  ON "report_detail_ai_expansions" ("team_id", "created_at");

CREATE INDEX IF NOT EXISTS "report_detail_ai_expansions_user_created_idx"
  ON "report_detail_ai_expansions" ("requested_by_user_id", "created_at");
