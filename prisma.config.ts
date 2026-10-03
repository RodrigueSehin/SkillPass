import { config } from "dotenv";

// Next.js reads .env.local; Prisma tooling and the seed must read the same file.
config({ path: ".env.local" });
config();
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL bypasses the Supabase pooler, which migrations require.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
