-- Brings an existing Supabase database up to date with every change since the first setup
-- (prisma/migrations 0003 to 0010). Safe to run more than once: every statement checks first.
-- Run it in the Supabase SQL editor, then reload the app. After it, optionally run
-- supabase/opportunities-seed.sql to fill the demo job board.

-- 0003 certifications: details, proof, linked skills
ALTER TABLE "certifications"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "level" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "document_name" TEXT,
  ADD COLUMN IF NOT EXISTS "document_size" INTEGER;

CREATE TABLE IF NOT EXISTS "certification_skills" (
    "certification_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    CONSTRAINT "certification_skills_pkey" PRIMARY KEY ("certification_id","skill_id")
);
CREATE INDEX IF NOT EXISTS "certification_skills_skill_id_idx" ON "certification_skills"("skill_id");
DO $$ BEGIN
  ALTER TABLE "certification_skills" ADD CONSTRAINT "certification_skills_certification_id_fkey"
    FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "certification_skills" ADD CONSTRAINT "certification_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "certification_skills" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certification skills readable" ON "certification_skills";
CREATE POLICY "certification skills readable" ON "certification_skills" FOR SELECT USING (true);

-- 0004 experiences: contract, work mode, domain, linked skills
ALTER TABLE "experiences"
  ADD COLUMN IF NOT EXISTS "contract_type" TEXT,
  ADD COLUMN IF NOT EXISTS "work_mode" TEXT,
  ADD COLUMN IF NOT EXISTS "domain" TEXT;

CREATE TABLE IF NOT EXISTS "experience_skills" (
    "experience_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    CONSTRAINT "experience_skills_pkey" PRIMARY KEY ("experience_id","skill_id")
);
CREATE INDEX IF NOT EXISTS "experience_skills_skill_id_idx" ON "experience_skills"("skill_id");
DO $$ BEGIN
  ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_experience_id_fkey"
    FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "experience_skills" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "experience skills readable" ON "experience_skills";
CREATE POLICY "experience skills readable" ON "experience_skills" FOR SELECT USING (true);

-- 0005 experience attachments
CREATE TABLE IF NOT EXISTS "experience_documents" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experience_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "experience_documents_experience_id_idx" ON "experience_documents"("experience_id");
DO $$ BEGIN
  ALTER TABLE "experience_documents" ADD CONSTRAINT "experience_documents_experience_id_fkey"
    FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "experience_documents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads own experience documents" ON "experience_documents";
CREATE POLICY "owner reads own experience documents" ON "experience_documents" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "experiences" e WHERE e.id = experience_id AND e.profile_id = auth.uid()));

-- 0006 + 0007 projects: domain, team, featured, cover, status, links, visibility
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "domain" TEXT,
  ADD COLUMN IF NOT EXISTS "team_size" INTEGER,
  ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cover_path" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT,
  ADD COLUMN IF NOT EXISTS "video_url" TEXT,
  ADD COLUMN IF NOT EXISTS "other_url" TEXT,
  ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT true;

-- 0008 + 0009 recommendations: rating, relation, keywords, the holder's request
ALTER TABLE "recommendations"
  ADD COLUMN IF NOT EXISTS "relation" TEXT,
  ADD COLUMN IF NOT EXISTS "rating" INTEGER,
  ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "request_subject" TEXT,
  ADD COLUMN IF NOT EXISTS "request_message" TEXT,
  ADD COLUMN IF NOT EXISTS "request_aspects" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 0010 job board, saved offers, alerts, address book
CREATE TABLE IF NOT EXISTS "opportunities" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_label" TEXT,
    "kind" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_mode" TEXT,
    "commitment" TEXT,
    "domain" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "apply_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "saved_opportunities" (
    "profile_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_opportunities_pkey" PRIMARY KEY ("profile_id","opportunity_id")
);

CREATE TABLE IF NOT EXISTS "job_alerts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "kind" TEXT,
    "region" TEXT,
    "domain" TEXT,
    "level" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contacts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "opportunities_published_at_idx" ON "opportunities"("published_at");
CREATE INDEX IF NOT EXISTS "saved_opportunities_opportunity_id_idx" ON "saved_opportunities"("opportunity_id");
CREATE INDEX IF NOT EXISTS "job_alerts_profile_id_idx" ON "job_alerts"("profile_id");
CREATE INDEX IF NOT EXISTS "contacts_profile_id_idx" ON "contacts"("profile_id");

DO $$ BEGIN
  ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_opportunity_id_fkey"
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opportunities readable" ON "opportunities";
CREATE POLICY "opportunities readable" ON "opportunities" FOR SELECT USING (true);

ALTER TABLE "saved_opportunities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner full access" ON "saved_opportunities";
CREATE POLICY "owner full access" ON "saved_opportunities" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

ALTER TABLE "job_alerts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner full access" ON "job_alerts";
CREATE POLICY "owner full access" ON "job_alerts" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner full access" ON "contacts";
CREATE POLICY "owner full access" ON "contacts" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- 0011 offer details and applications
ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "applicants" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "work_mode_detail" TEXT,
  ADD COLUMN IF NOT EXISTS "experience_range" TEXT,
  ADD COLUMN IF NOT EXISTS "salary" TEXT,
  ADD COLUMN IF NOT EXISTS "missions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "process" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "optional_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "company_legal_name" TEXT,
  ADD COLUMN IF NOT EXISTS "company_sector" TEXT,
  ADD COLUMN IF NOT EXISTS "company_size" TEXT,
  ADD COLUMN IF NOT EXISTS "company_about" TEXT,
  ADD COLUMN IF NOT EXISTS "company_tagline" TEXT,
  ADD COLUMN IF NOT EXISTS "company_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "company_website" TEXT;

CREATE TABLE IF NOT EXISTS "applications" (
    "profile_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("profile_id","opportunity_id")
);

CREATE INDEX IF NOT EXISTS "applications_opportunity_id_idx" ON "applications"("opportunity_id");

DO $$ BEGIN
  ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunity_id_fkey"
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner full access" ON "applications";
CREATE POLICY "owner full access" ON "applications" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
