-- AlterTable
ALTER TABLE "certifications"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "level" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "document_name" TEXT,
  ADD COLUMN "document_size" INTEGER;

-- CreateTable
CREATE TABLE "certification_skills" (
    "certification_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "certification_skills_pkey" PRIMARY KEY ("certification_id","skill_id")
);

-- CreateIndex
CREATE INDEX "certification_skills_skill_id_idx" ON "certification_skills"("skill_id");

-- AddForeignKey
ALTER TABLE "certification_skills" ADD CONSTRAINT "certification_skills_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_skills" ADD CONSTRAINT "certification_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (same model as project_skills: the app filters by owner, the API only reads)
ALTER TABLE "certification_skills" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certification skills readable" ON "certification_skills" FOR SELECT USING (true);
