-- AlterTable
ALTER TABLE "recommendations"
  ADD COLUMN "request_subject" TEXT,
  ADD COLUMN "request_message" TEXT,
  ADD COLUMN "request_aspects" TEXT[] DEFAULT ARRAY[]::TEXT[];
