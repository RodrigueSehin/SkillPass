-- AlterTable
ALTER TABLE "recommendations"
  ADD COLUMN "relation" TEXT,
  ADD COLUMN "rating" INTEGER,
  ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
