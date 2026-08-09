import { expect, test } from "@playwright/test";
import {
  cleanupUser,
  completeOnboarding,
  prisma,
  registerToOnboarding,
  v46Email,
} from "./helpers/v46-user";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("V46.4 Listening and Speaking laboratories degrade safely", async ({ page }) => {
  const email = v46Email("labs");

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "GERMANY_LIFE",
      daily: 30,
      days: 5,
      skills: ["LISTENING", "SPEAKING"],
    });

    // Listening: unsupported speech engine must show a recoverable state, not crash.
    await page.addInitScript(() => {
      try {
        Reflect.deleteProperty(window, "speechSynthesis");
      } catch {
        Object.defineProperty(window, "speechSynthesis", {
          configurable: true,
          value: undefined,
        });
      }
    });

    const listeningResponse = await page.goto("/listening");
    expect(listeningResponse?.status() ?? 500).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Dinle/i }).first()).toBeVisible();

    await page.getByRole("button", { name: /Dinlemeye/i }).click();

    await expect(page.getByRole("button", { name: /Normal [^/]+/i }).first()).toBeVisible();

    await page.getByRole("button", { name: /Normal hız/i }).first().click();
    await expect(page.locator("body")).toContainText(/desteklemiyor|sesli okuma|yeniden deney/i);

    // V45 accessible text alternative remains reachable.
    const transcript = page.getByText(/Erişilebilir transkript|metin alternatifi/i).first();
    await expect(transcript).toBeVisible();

    // Speaking: emulate browser permission denial through Web Speech API.
    await page.addInitScript(() => {
      class DeniedRecognition {
        lang = "";
        continuous = false;
        interimResults = false;
        onresult: ((event: unknown) => void) | null = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((event: { error?: string }) => void) | null = null;
        start() {
          setTimeout(() => this.onerror?.({ error: "not-allowed" }), 0);
        }
        stop() {
          this.onend?.();
        }
      }
      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        value: DeniedRecognition,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        configurable: true,
        value: DeniedRecognition,
      });
    });

    const speakingResponse = await page.goto("/speaking");
    expect(speakingResponse?.status() ?? 500).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Konuş/i }).first()).toBeVisible();

    await page.getByRole("button", { name: /Mikrofon/i }).first().click();
    await expect(page.locator("body")).toContainText(/izin|redded|elle yaz|mikrofon/i);

    // Permission denial must still leave a manual continuation path.
    const textarea = page.getByLabel("Konuşma metni");
    await expect(textarea).toBeVisible();
    await textarea.fill("Ich möchte einen Termin vereinbaren.");

    // Simulate API/server failure. Evaluation should remain visible and app must not crash.
    await page.route("**/api/skills/attempts", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "V46 simulated temporary failure" }),
      });
    });

    await page.getByRole("button", { name: /Konuşmayı Değerlendir/i }).click();
    await expect(page.locator("body")).toContainText(
      /kaydedilemedi|Değerlendirme|iletişim başarısı/i,
    );

    // Mobile viewport should remain usable without systemic horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(4);
  } finally {
    await cleanupUser(email);
  }
});
