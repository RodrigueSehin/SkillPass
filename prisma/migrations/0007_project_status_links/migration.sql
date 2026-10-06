-- AlterTable
ALTER TABLE "projects"
  ADD COLUMN "status" TEXT,
  ADD COLUMN "video_url" TEXT,
  ADD COLUMN "other_url" TEXT,
  ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT true;
