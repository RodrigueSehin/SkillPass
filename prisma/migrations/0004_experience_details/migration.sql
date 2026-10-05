-- AlterTable
ALTER TABLE "experiences"
  ADD COLUMN "contract_type" TEXT,
  ADD COLUMN "work_mode" TEXT,
  ADD COLUMN "domain" TEXT;

-- CreateTable
CREATE TABLE "experience_skills" (
    "experience_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "experience_skills_pkey" PRIMARY KEY ("experience_id","skill_id")
);

-- CreateIndex
CREATE INDEX "experience_skills_skill_id_idx" ON "experience_skills"("skill_id");

-- AddForeignKey
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (same model as project_skills)
ALTER TABLE "experience_skills" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experience skills readable" ON "experience_skills" FOR SELECT USING (true);
