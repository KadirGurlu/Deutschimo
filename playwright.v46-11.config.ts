import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.V46_11_PORT || 4611);
const baseURL =
  process.env.V46_11_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /v46-11-(?:critical-release|performance)\.spec\.ts/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      process.env.PLAYWRIGHT_SKIP_BUILD === "true"
        ? `npm run start -- -H localhost -p ${port}`
        : `npm run build && npm run start -- -H localhost -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      AUTH_URL: baseURL,
      AUTH_SECRET:
        process.env.AUTH_SECRET || "v46-11-e2e-auth-secret-at-least-32-characters",
      AUTH_TRUST_HOST: "true",
      NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
      REQUIRE_EMAIL_VERIFICATION: "false",
      BOOTSTRAP_ADMIN_ON_BUILD: "false",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

