-- Talent plans (Free / Pro).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'FREE';
