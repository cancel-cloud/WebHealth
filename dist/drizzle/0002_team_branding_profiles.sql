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
ALTER TABLE "team_branding_profiles" ADD CONSTRAINT "team_branding_profiles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "team_branding_profiles_team_updated_idx" ON "team_branding_profiles" USING btree ("team_id","updated_at");
