import { expect, test } from "@playwright/test";

test.describe("Güvenlik ve temel arayüz kalite kapıları", () => {
  test("ana yanıtta zorunlu güvenlik başlıkları bulunur", async ({ request }) => {
    const response = await request.get("/");

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  test("çapraz kaynaktan gelen kritik API isteği reddedilir", async ({ request }) => {
    const response = await request.post("/api/account/delete", {
      headers: {
        origin: "https://example-attacker.invalid",
        "sec-fetch-site": "cross-site",
        "content-type": "application/json",
      },
      data: {},
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ error: "İstek kaynağı doğrulanamadı." });
  });

  test("mobil görünüm yatay taşma üretmez", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    await expect(page.getByRole("heading", { name: "Almanca öğrenmenin sade ve düzenli yolu." })).toBeVisible();
  });
});
