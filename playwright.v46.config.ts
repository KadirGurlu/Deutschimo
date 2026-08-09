import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT || 4600);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /v46-.*\.spec\.ts/,
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
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
