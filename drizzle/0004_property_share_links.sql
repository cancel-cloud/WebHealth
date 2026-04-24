ALTER TABLE "action_items"
  ADD COLUMN "assignee_user_id" text,
  ADD COLUMN "assignee_email" text;

ALTER TABLE "action_items"
  ADD CONSTRAINT "action_items_assignee_user_id_user_id_fk"
  FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

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

ALTER TABLE "property_share_links"
  ADD CONSTRAINT "property_share_links_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_share_links"
  ADD CONSTRAINT "property_share_links_property_id_properties_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_share_links"
  ADD CONSTRAINT "property_share_links_created_by_user_id_user_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "property_share_links_token_idx" ON "property_share_links" USING btree ("token");
CREATE INDEX "property_share_links_property_created_idx" ON "property_share_links" USING btree ("property_id","created_at");
CREATE INDEX "property_share_links_team_created_idx" ON "property_share_links" USING btree ("team_id","created_at");
