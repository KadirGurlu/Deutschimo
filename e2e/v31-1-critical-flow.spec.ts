import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const password = "V31.1-Test!2026";
const sidebarLinks = [
  ["Öğrenci Paneli", "/dashboard"],
  ["Kurslar", "/courses"],
  ["Yazma Koçu", "/writing-coach"],
  ["Seviye Testi", "/placement-test"],
  ["Akıllı Tekrar", "/smart-review"],
  ["Günlük Plan", "/study-plan"],
  ["Beceri Laboratuvarı", "/skills"],
  ["Kelime Setlerim", "/vocabulary"],
  ["İlerleme", "/progress"],
  ["Gerçek Almanya Modu", "/real-germany"],
  ["Profil", "/profile"],
  ["Ayarlar", "/profile"],
] as const;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("V31.1 kritik kullanici akisi: ana sayfa, kayit, cikis, giris ve sidebar", async ({ page }) => {
  const email = `e2e.v311.${Date.now()}@preview.deutschimo.test`;

  try {
    const homeResponse = await page.goto("/");
    expect(homeResponse?.status() ?? 500).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);

    await page.goto("/auth?mode=register");
    await expect(page.getByRole("heading", { name: "Öğrenme hesabını oluştur" })).toBeVisible();
    await page.getByLabel("Ad", { exact: true }).fill("V31");
    await page.getByLabel("Soyad", { exact: true }).fill("Stabilite");
    await page.getByLabel("E-posta", { exact: true }).fill(email);
    await page.getByLabel("Şifre", { exact: true }).fill(password);
    await page.getByLabel("Mevcut seviye", { exact: true }).selectOption("A1");
    await page.getByLabel("Hedef seviye", { exact: true }).selectOption("B2");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Hesap Oluştur" }).click();

    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Tekrar hoş geldin/i })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Çıkış yap/i }).first().click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Giriş Yap" }).first()).toBeVisible();

    await page.goto("/auth?mode=login");
    await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Şifre").fill(password);
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    for (const [label, route] of sidebarLinks) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      const link = page.getByRole("link", { name: label, exact: true });
      await expect(link, `${label} sidebar baglantisi gorunmeli`).toBeVisible();
      await expect(link).toHaveAttribute("href", route);
      await link.click();
      await expect(page, `${label} dogru rotayi acmali`).toHaveURL(new RegExp(`${route.replace("/", "\\/")}(?:\\?|$)`));
      await expect(page, `${route} login sayfasina yonlenmemeli`).not.toHaveURL(/\/auth\?mode=login/);
      await expect(page.locator("body"), `${route} 404 gostermemeli`).not.toContainText(/404|This page could not be found/i);
    }
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});
