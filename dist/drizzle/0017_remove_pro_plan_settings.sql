UPDATE "teams"
SET "tier" = 'studio'
WHERE "tier" = 'pro';

DELETE FROM "plan_settings"
WHERE "tier" = 'pro';
