import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = externalBaseUrl || `http://127.0.0.1:${port}`;
const skipBuild = process.env.PLAYWRIGHT_SKIP_BUILD === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: skipBuild
          ? `npm run start -- --hostname 127.0.0.1 --port ${port}`
          : `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/deutschimo_test",
          DATABASE_POSTGRES_URL: process.env.DATABASE_POSTGRES_URL ?? process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/deutschimo_test",
          DATABASE_ENVIRONMENT: process.env.DATABASE_ENVIRONMENT ?? "test",
          AUTH_SECRET: process.env.AUTH_SECRET ?? "v31-1-e2e-auth-secret-please-change-2026",
          SECURITY_HASH_KEY: process.env.SECURITY_HASH_KEY ?? "v31-1-e2e-security-hash-key-please-change-2026",
          CRON_SECRET: process.env.CRON_SECRET ?? "v31-1-e2e-cron-secret-please-change-2026",
          AUTH_URL: process.env.AUTH_URL ?? baseURL,
          AUTH_TRUST_HOST: "true",
          NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
          REQUIRE_EMAIL_VERIFICATION: "false",
          AUTO_INIT_NON_PRODUCTION_DATABASE: "false",
          TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD ?? "DeutschimoTest2026!",
        },
      },
});
