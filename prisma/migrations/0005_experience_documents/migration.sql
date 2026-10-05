-- CreateTable
CREATE TABLE "experience_documents" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_documents_experience_id_idx" ON "experience_documents"("experience_id");

-- AddForeignKey
ALTER TABLE "experience_documents" ADD CONSTRAINT "experience_documents_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security: owner only (files are served by the app after an ownership check)
ALTER TABLE "experience_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own experience documents" ON "experience_documents" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "experiences" e WHERE e.id = experience_id AND e.profile_id = auth.uid()));
