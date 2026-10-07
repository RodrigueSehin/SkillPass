-- Phase 4, step 2: job offers published by organizations.
ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "source_offer_id" UUID,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS "opportunities_source_offer_id_key" ON "opportunities"("source_offer_id");

CREATE TABLE IF NOT EXISTS "job_offers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "contract" TEXT NOT NULL DEFAULT 'CDI',
    "location" TEXT NOT NULL DEFAULT '',
    "work_mode" TEXT,
    "department_id" UUID,
    "experience" TEXT NOT NULL DEFAULT '1 à 3 ans',
    "positions" INTEGER NOT NULL DEFAULT 1,
    "deadline" DATE,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "soft_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "other_language" TEXT,
    "permit" TEXT,
    "mobility" TEXT NOT NULL DEFAULT 'NONE',
    "availability" TEXT NOT NULL DEFAULT 'ASAP',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "publish_on" DATE,
    "duration_months" INTEGER NOT NULL DEFAULT 2,
    "channels" TEXT[] DEFAULT ARRAY['PLATFORM']::TEXT[],
    "application_mode" TEXT NOT NULL DEFAULT 'SIMPLE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "opportunity_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "job_offers_organization_id_idx" ON "job_offers"("organization_id");

DO $$ BEGIN
  ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "job_offers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read their job offers" ON "job_offers";
CREATE POLICY "members read their job offers" ON "job_offers" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "organization_members" m WHERE m.organization_id = job_offers.organization_id AND m.profile_id = auth.uid()));
