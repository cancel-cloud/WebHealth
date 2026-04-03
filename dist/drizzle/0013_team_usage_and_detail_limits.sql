ALTER TABLE "plan_settings" ADD COLUMN "details_per_month" integer;

CREATE TABLE "team_usage" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "year_month" text NOT NULL,
  "details_count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "team_usage_team_id_year_month_unique" UNIQUE("team_id","year_month")
);
