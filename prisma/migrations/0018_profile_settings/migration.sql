-- Talent settings (notifications and privacy preferences).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}';
