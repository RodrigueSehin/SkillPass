-- AlterTable
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

-- CreateTable
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
