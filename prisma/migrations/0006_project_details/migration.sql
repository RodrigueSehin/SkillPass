-- AlterTable
ALTER TABLE "projects"
  ADD COLUMN "domain" TEXT,
  ADD COLUMN "team_size" INTEGER,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cover_path" TEXT;
