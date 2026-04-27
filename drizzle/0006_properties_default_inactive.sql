ALTER TABLE "properties" ALTER COLUMN "active" SET DEFAULT false;
--> statement-breakpoint
UPDATE "properties" SET "active" = false;
