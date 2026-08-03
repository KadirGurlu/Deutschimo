import { expect, test } from "@playwright/test";

test.describe("Ziyaretçi öğrenme akışı", () => {
  test("ana sayfa yüklenir ve kayıt akışına geçer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Almanca öğrenmenin sade ve düzenli yolu." })).toBeVisible();
    await expect(page.getByText("66 yapılandırılmış ünite")).toBeVisible();

    await page.getByRole("link", { name: "Kayıt Ol" }).first().click();
    await expect(page).toHaveURL(/\/auth\?mode=register/);
    await expect(page.getByRole("heading", { name: "Öğrenme hesabını oluştur" })).toBeVisible();
  });

  test("seviye seçimi seçilen seviyeyi kayıt formuna taşır", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "A2 seviyesini seçerek kayıt ol" }).click();

    await expect(page).toHaveURL(/\/auth\?mode=register&level=A2/);
    await expect(page.getByLabel("Mevcut seviye")).toHaveValue("A2");
  });

  test("giriş bağlantısı doğrudan giriş ekranını açar", async ({ page }) => {
    await page.goto("/auth?mode=login");

    await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
    await expect(page.getByLabel("E-posta")).toBeVisible();
    await expect(page.getByLabel("Şifre")).toBeVisible();
    await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
  });

  test("oturumsuz kullanıcı korumalı öğrenci paneline giremez", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/auth\?mode=login/);
    await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
  });
});
