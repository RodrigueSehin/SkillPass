-- Talent settings (notifications and privacy preferences). Run after update-0017-matching.sql. Safe to run more than once.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}';
