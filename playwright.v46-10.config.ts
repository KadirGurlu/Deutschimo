import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT || 4610);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /v46-10-.*\.spec\.ts/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
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
        ? `npm run start -- -H 127.0.0.1 -p ${port}`
        : `npm run build && npm run start -- -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      AUTH_SECRET:
        process.env.AUTH_SECRET || "v46-10-a11y-auth-secret-at-least-32-characters",
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
