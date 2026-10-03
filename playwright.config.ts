import { defineConfig, devices } from "@playwright/test";

// E2E runs on its own port against the in-memory demo repositories. Empty values override
// .env.local (Next never overrides variables that are already set), so tests never touch
// the real Supabase project or database.
const PORT = 3100;
// E2E_BASE_URL=http://localhost:3000 runs the environment-independent specs (landing, smoke,
// carousel) against a server that is already running, e.g. your own `npm run dev`.
const EXTERNAL_URL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: EXTERNAL_URL ?? `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          SUPABASE_SERVICE_ROLE_KEY: "",
          DATABASE_URL: "",
          DIRECT_URL: "",
          NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
          // No waiting time between attempts so assessment flows can be re-run in tests.
          ASSESSMENT_COOLDOWN_HOURS: "0",
        },
      },
});
