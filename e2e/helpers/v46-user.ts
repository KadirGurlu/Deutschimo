import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const v46Password = "V46-Release!2026";

export function v46Email(prefix: string) {
  return `e2e.v46.${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@preview.deutschimo.test`;
}

function v46ClientIp(email: string) {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i += 1) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const third = (hash >>> 8) & 255;
  const fourth = (hash & 253) + 1;
  return `198.18.${third}.${fourth}`;
}

export async function registerToOnboarding(page: Page, email: string) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": v46ClientIp(email) });
  await page.goto("/auth?mode=register");
  await page.getByLabel("Ad", { exact: true }).fill("V46");
  await page.getByLabel("Soyad", { exact: true }).fill("Release");
  await page.getByLabel("E-posta", { exact: true }).fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(v46Password);
  const checkbox = page.getByRole("checkbox");
  if (await checkbox.count()) await checkbox.first().check();
  await page.getByRole("button", { name: "Hesap Oluştur" }).click();
  await expect(page).toHaveURL(/\/onboarding(?:\?|$)/, { timeout: 30_000 });
}

export async function completeOnboarding(
  page: Page,
  args?: {
    level?: "A1" | "A2" | "B1" | "B2";
    goal?: string;
    daily?: number;
    days?: number;
    skills?: string[];
    exercisePlacementBridge?: boolean;
  },
) {
  const level = args?.level ?? "A1";
  const goal = args?.goal ?? "GERMANY_LIFE";
  const daily = args?.daily ?? 30;
  const days = args?.days ?? 5;
  const skills = args?.skills?.length ? args.skills : ["VOCABULARY"];

  if (args?.exercisePlacementBridge) {
    await page.getByTestId("level-UNSURE").click();
    await expect(page.getByRole("button", { name: /Seviye testine git/i })).toBeVisible();
    await page.getByRole("button", { name: /Seviye testine git/i }).click();
    await expect(page).toHaveURL(/\/placement-test\?onboarding=1/, { timeout: 20_000 });
    await expect(page.locator("body")).toContainText(/Seviyeni belirle|Seviye/i);
    await page.goto("/onboarding?from=placement");
  }

  await page.getByTestId(`level-${level}`).click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId(`goal-${goal}`).click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId(`daily-${daily}`).click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId(`days-${days}`).click();
  await page.getByTestId("onboarding-next").click();

  for (const skill of skills) {
    await page.getByTestId(`skill-${skill}`).click();
  }

  await page.getByTestId("onboarding-complete").click();
  await expect(page.getByTestId("onboarding-plan")).toBeVisible();
  await page.getByRole("button", { name: /Öğrenci paneline geç/i }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });
}

export async function login(page: Page, email: string, password = v46Password) {
  await page.goto("/auth?mode=login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre").fill(password);
  await page.locator("form").getByRole("button", { name: "Giriş Yap" }).click();
}

export async function logout(page: Page) {
  await page.goto("/dashboard");
  const button = page.getByRole("button", { name: /Çıkış yap/i }).first();
  await expect(button).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await button.click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/, { timeout: 20_000 });
}

export async function cleanupUser(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}
