-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_label" TEXT,
    "kind" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_mode" TEXT,
    "commitment" TEXT,
    "domain" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "apply_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_opportunities" (
    "profile_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_opportunities_pkey" PRIMARY KEY ("profile_id","opportunity_id")
);

-- CreateTable
CREATE TABLE "job_alerts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "kind" TEXT,
    "region" TEXT,
    "domain" TEXT,
    "level" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunities_published_at_idx" ON "opportunities"("published_at");
CREATE INDEX "saved_opportunities_opportunity_id_idx" ON "saved_opportunities"("opportunity_id");
CREATE INDEX "job_alerts_profile_id_idx" ON "job_alerts"("profile_id");
CREATE INDEX "contacts_profile_id_idx" ON "contacts"("profile_id");

-- AddForeignKey
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security: offers are readable by everyone, the rest belongs to its owner.
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities readable" ON "opportunities" FOR SELECT USING (true);

ALTER TABLE "saved_opportunities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner full access" ON "saved_opportunities" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

ALTER TABLE "job_alerts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner full access" ON "job_alerts" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner full access" ON "contacts" FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
