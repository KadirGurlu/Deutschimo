import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

const testEnvironment: Record<string, string> = {
  NODE_ENV: "development",
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://ci_user:ci_password@127.0.0.1:5432/deutschimo_ci",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "ci-auth-secret-32-characters-minimum-2026",
  SECURITY_HASH_KEY: process.env.SECURITY_HASH_KEY ?? "ci-security-hash-key-32-characters-2026",
  CRON_SECRET: process.env.CRON_SECRET ?? "ci-cron-secret-32-characters-minimum-2026",
  AUTH_URL: process.env.AUTH_URL ?? baseURL,
  AUTH_TRUST_HOST: "true",
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
  REQUIRE_EMAIL_VERIFICATION: "false",
  BOOTSTRAP_ADMIN_ON_BUILD: "false",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_500 },
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: testEnvironment,
    stdout: "pipe",
    stderr: "pipe",
  },
});
