import { expect, test } from "@playwright/test";
import {
  cleanupUser,
  completeOnboarding,
  login,
  logout,
  prisma,
  registerToOnboarding,
  v46Email,
  v46Password,
} from "./helpers/v46-user";

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("V46.1 Authentication -> Onboarding -> Placement bridge -> Dashboard E2E", async ({ page, context }) => {
  const email = v46Email("auth");

  try {
    await context.clearCookies();

    // Route guard: protected student surfaces must not expose private state.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);

    await page.goto("/placement-test");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);

    // Registration.
    await registerToOnboarding(page, email);

    // Placement-test bridge is part of the onboarding flow.
    await completeOnboarding(page, {
      level: "A1",
      goal: "GERMANY_LIFE",
      daily: 30,
      days: 5,
      skills: ["LISTENING", "SPEAKING"],
      exercisePlacementBridge: true,
    });

    const stored = await prisma.user.findUnique({
      where: { email },
      include: { onboardingProfile: true },
    });

    expect(stored).toBeTruthy();
    expect(stored?.onboardingCompleted).toBe(true);
    expect(stored?.dailyGoalMinutes).toBe(30);
    expect(stored?.onboardingProfile?.studyDaysPerWeek).toBe(5);

    // Logout destroys the browser session boundary.
    await logout(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);

    // Wrong password must not create a valid session.
    await login(page, email, "V46-Wrong-Password!2026");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);

    // Correct password restores the same user.
    await page.getByLabel("Şifre").fill(v46Password);
    await page.locator("form").getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    // Completed onboarding must remain persisted after re-login.
    const afterLogin = await prisma.user.findUnique({
      where: { email },
      select: { onboardingCompleted: true, currentLevel: true, dailyGoalMinutes: true },
    });
    expect(afterLogin?.onboardingCompleted).toBe(true);
    expect(afterLogin?.dailyGoalMinutes).toBe(30);

    // Duplicate registration must never create a second account.
    await logout(page);
    await page.goto("/auth?mode=register");
    await page.getByLabel("Ad", { exact: true }).fill("Duplicate");
    await page.getByLabel("Soyad", { exact: true }).fill("V46");
    await page.getByLabel("E-posta", { exact: true }).fill(email);
    await page.getByLabel("Şifre", { exact: true }).fill(v46Password);
    const checkbox = page.getByRole("checkbox");
    if (await checkbox.count()) await checkbox.first().check();
    await page.getByRole("button", { name: "Hesap Oluştur" }).click();
    await page.waitForTimeout(800);

    expect(await prisma.user.count({ where: { email } })).toBe(1);
  } finally {
    await cleanupUser(email);
  }
});
