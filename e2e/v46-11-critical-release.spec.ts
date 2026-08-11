import { expect, test } from "@playwright/test";
import {
  cleanupUser,
  completeOnboarding,
  login,
  logout,
  prisma,
  registerToOnboarding,
  v46Email,
} from "./helpers/v46-user";

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("Scenario 04 — Admin Publishing: create -> publish -> student sees content", async ({ page }) => {
  const email = v46Email("admin-publish");
  const key = `lesson:v46-11-${Date.now()}`;
  const title = `V46.11 Published Lesson ${Date.now()}`;
  let recordId: string | null = null;

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "IMPROVE",
      daily: 30,
      days: 5,
      skills: ["GRAMMAR"],
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    if (!user) throw new Error("V46.11 admin test user missing");

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });

    await logout(page);
    await login(page, email);
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    const adminResponse = await page.goto("/admin");
    expect(adminResponse?.status() ?? 500).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Deutschimo genel bakış/i })).toBeVisible();

    const created = await page.evaluate(async ({ key, title }) => {
      const response = await fetch("/api/admin/content-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          entityType: "LESSON",
          title,
          courseKey: "a1",
          unitKey: "a1-u01",
          level: "A1",
        }),
      });
      return { status: response.status, body: await response.json() };
    }, { key, title });

    expect(created.status).toBe(201);
    recordId = created.body.record.id as string;
    expect(recordId).toBeTruthy();

    for (const status of ["REVIEW", "READY", "PUBLISHED"]) {
      const updated = await page.evaluate(async ({ id, status }) => {
        const response = await fetch(`/api/admin/content-studio/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            changeNote: `V46.11 E2E ${status}`,
          }),
        });
        return { status: response.status, body: await response.json() };
      }, { id: recordId, status });

      expect(updated.status).toBe(200);
      expect(updated.body.record.status).toBe(status);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "STUDENT" },
    });

    await logout(page);
    await login(page, email);
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    const visible = await page.evaluate(async (title) => {
      const response = await fetch("/api/content/unit/a1-u01");
      const body = await response.json();
      return {
        status: response.status,
        found: Array.isArray(body.slides) &&
          body.slides.some((slide: { title?: string }) => slide.title === title),
      };
    }, title);

    expect(visible.status).toBe(200);
    expect(visible.found).toBe(true);
  } finally {
    await prisma.cmsContentRecord.deleteMany({ where: { key } }).catch(() => {});
    await cleanupUser(email);
  }
});

test("Scenario 05 — Authorization: student /admin and direct admin API are denied", async ({ page }) => {
  const email = v46Email("authorization");

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "IMPROVE",
      daily: 30,
      days: 5,
      skills: ["VOCABULARY"],
    });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);

    const response = await page.request.get("/api/admin/stats");
    expect([401, 403]).toContain(response.status());
  } finally {
    await cleanupUser(email);
  }
});

test("Scenario 07 — Failure Recovery: temporary API failure -> feedback -> retry succeeds", async ({ page }) => {
  const email = v46Email("recovery");
  let attemptCalls = 0;

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "GERMANY_LIFE",
      daily: 30,
      days: 5,
      skills: ["SPEAKING"],
    });

    await page.route("**/api/skills/attempts", async (route) => {
      attemptCalls += 1;
      if (attemptCalls === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "V46.11 simulated temporary failure" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/speaking");
    const textarea = page.getByLabel("Konuşma metni");
    await textarea.fill("Ich möchte einen Termin vereinbaren und brauche bitte Hilfe.");

    const evaluateButton = page.getByRole("button", { name: /Konuşmayı Değerlendir/i });
    await evaluateButton.click();
    await expect(page.locator(".lab-note[role=\"status\"]")).toContainText(/kaydedilemedi/i);

    await evaluateButton.click();
    await expect(page.locator(".lab-note[role=\"status\"]")).toContainText(/hesabına kaydedildi/i);
    expect(attemptCalls).toBeGreaterThanOrEqual(2);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    if (user) {
      expect(
        await prisma.skillLabAttempt.count({
          where: { userId: user.id, skill: "SPEAKING" },
        }),
      ).toBeGreaterThan(0);
    }
  } finally {
    await cleanupUser(email);
  }
});
