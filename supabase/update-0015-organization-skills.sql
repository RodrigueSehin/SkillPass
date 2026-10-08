-- Phase 4, step 5 (Business skills referential). Run after update-0014-evaluations.sql. Safe to run more than once.

CREATE TABLE IF NOT EXISTS "organization_skills" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_skills_organization_id_name_key_key" ON "organization_skills"("organization_id", "name_key");

DO $$ BEGIN
  ALTER TABLE "organization_skills" ADD CONSTRAINT "organization_skills_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Row Level Security: members read their organization's skills through the Supabase API.
-- (The application itself goes through Prisma and checks membership in code.)
ALTER TABLE "organization_skills" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their skills" ON "organization_skills";
CREATE POLICY "members read their skills" ON "organization_skills" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = organization_skills.organization_id AND m.profile_id = auth.uid()));