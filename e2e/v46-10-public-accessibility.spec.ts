import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/auth?mode=login",
  "/auth?mode=register",
  "/forgot-password",
  "/reset-password?token=v46-10-invalid-token-for-a11y-render",
];

test.describe("V46.10 WCAG manual-assisted public accessibility pass", () => {
  test("public forms expose an accessible name", async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      const controls = page.locator("input:visible, select:visible, textarea:visible");
      const count = await controls.count();

      for (let index = 0; index < count; index += 1) {
        const control = controls.nth(index);
        const accessible = await control.evaluate((element) => {
          const field = element as HTMLInputElement;
          return Boolean(
            field.labels?.length ||
              field.getAttribute("aria-label")?.trim() ||
              field.getAttribute("aria-labelledby")?.trim() ||
              field.getAttribute("title")?.trim(),
          );
        });
        expect(accessible, `${route}: form control ${index + 1} needs an accessible name`).toBe(true);
      }
    }
  });

  test("keyboard focus is visible and navigation does not immediately trap", async ({ page }) => {
    await page.goto("/auth?mode=login");

    const seen = new Set<string>();
    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return null;
        const style = getComputedStyle(active);
        return {
          key: `${active.tagName}:${active.id}:${active.textContent?.trim().slice(0, 30) ?? ""}`,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth || "0"),
          boxShadow: style.boxShadow,
        };
      });

      if (!state) continue;
      seen.add(state.key);
      const visibleFocus =
        (state.outlineStyle !== "none" && state.outlineWidth >= 1) ||
        (state.boxShadow !== "none" && state.boxShadow !== "");
      expect(visibleFocus, `keyboard focus must remain visible for ${state.key}`).toBe(true);
    }

    expect(seen.size, "keyboard should move through multiple interactive controls").toBeGreaterThan(3);
  });

  test("auth mode controls are keyboard operable", async ({ page }) => {
    await page.goto("/auth?mode=login");
    const register = page.getByRole("button", { name: "Kayıt Ol" }).first();
    await register.focus();
    await page.keyboard.press("Enter");
    await expect(register).toHaveAttribute("aria-pressed", "true");

    const login = page.getByRole("button", { name: "Giriş Yap" }).first();
    await login.focus();
    await page.keyboard.press("Space");
    await expect(login).toHaveAttribute("aria-pressed", "true");
  });

  test("reduced motion disables decorative transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.locator(".button").first().evaluate((element) => {
      const style = getComputedStyle(element);
      const values = style.transitionDuration
        .split(",")
        .map((value) => value.trim())
        .map((value) => (value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000));
      return Math.max(...values.filter(Number.isFinite), 0);
    });
    expect(duration, "reduced motion transition duration should be effectively disabled").toBeLessThanOrEqual(20);
  });
});
