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
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "property_setup_dismissals" ADD CONSTRAINT "property_setup_dismissals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "property_setup_dismissals_team_property_idx" ON "property_setup_dismissals" USING btree ("team_id","property_id");
