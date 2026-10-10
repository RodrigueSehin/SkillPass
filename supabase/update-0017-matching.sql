-- Phase 5, step 1 (Business matching: saved talents and history). Run after update-0016-organization-settings.sql
-- (or after update-0012-0016-business.sql). Safe to run more than once.

CREATE TABLE IF NOT EXISTS "matching_saves" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_CONTACT',
    "job_offer_id" UUID,
    "match" INTEGER,
    "saved_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matching_saves_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "matching_saves_organization_id_profile_id_key" ON "matching_saves"("organization_id", "profile_id");
CREATE INDEX IF NOT EXISTS "matching_saves_organization_id_created_at_idx" ON "matching_saves"("organization_id", "created_at");

CREATE TABLE IF NOT EXISTS "matching_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "results" INTEGER,
    "query" TEXT,
    "profile_id" UUID,
    "member_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matching_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "matching_events_organization_id_created_at_idx" ON "matching_events"("organization_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "matching_saves" ADD CONSTRAINT "matching_saves_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_saves" ADD CONSTRAINT "matching_saves_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_saves" ADD CONSTRAINT "matching_saves_job_offer_id_fkey"
    FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_saves" ADD CONSTRAINT "matching_saves_saved_by_id_fkey"
    FOREIGN KEY ("saved_by_id") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_events" ADD CONSTRAINT "matching_events_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_events" ADD CONSTRAINT "matching_events_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Row Level Security: members read their organization's matching data through the Supabase API.
-- (The application itself goes through Prisma and checks membership in code.)
ALTER TABLE "matching_saves" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their saved matches" ON "matching_saves";
CREATE POLICY "members read their saved matches" ON "matching_saves" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = matching_saves.organization_id AND m.profile_id = auth.uid()));
ALTER TABLE "matching_events" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their matching history" ON "matching_events";
CREATE POLICY "members read their matching history" ON "matching_events" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = matching_events.organization_id AND m.profile_id = auth.uid()));
