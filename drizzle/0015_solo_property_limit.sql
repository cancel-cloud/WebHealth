UPDATE "plan_settings"
SET "max_properties" = 1,
    "updated_at" = now()
WHERE "tier" = 'free';
