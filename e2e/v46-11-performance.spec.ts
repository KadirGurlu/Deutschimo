import { expect, test, type Page } from "@playwright/test";

type LabVitals = {
  LCP: number;
  INP: number;
  CLS: number;
  TTFB: number;
};

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
} as const;

async function installObservers(page: Page) {
  await page.addInitScript(() => {
    const state = { LCP: 0, INP: 0, CLS: 0 };
    Object.defineProperty(window, "__v4611Vitals", {
      configurable: true,
      value: state,
    });

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.LCP = Math.max(state.LCP, entry.startTime);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput) state.CLS += Number(entry.value || 0);
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number; duration?: number }>) {
          if (Number(entry.interactionId || 0) > 0) {
            state.INP = Math.max(state.INP, Number(entry.duration || 0));
          }
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {}
  });
}

async function readVitals(page: Page): Promise<LabVitals> {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const state =
      (window as typeof window & { __v4611Vitals?: { LCP: number; INP: number; CLS: number } })
        .__v4611Vitals ?? { LCP: 0, INP: 0, CLS: 0 };
    return {
      LCP: Number(state.LCP || 0),
      INP: Number(state.INP || 0),
      CLS: Number(state.CLS || 0),
      TTFB: nav ? Math.max(0, nav.responseStart - nav.requestStart) : 0,
    };
  });
}

function verdict(name: keyof LabVitals, value: number) {
  const rule = thresholds[name];
  if (value <= rule.good) return "GOOD";
  if (value <= rule.poor) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function assertNotPoor(route: string, metrics: LabVitals) {
  for (const name of ["LCP", "INP", "CLS", "TTFB"] as const) {
    const value = metrics[name];
    if (name === "INP" && value === 0) {
      console.warn(`[V46.11 PERF] ${route} INP: not observed in this lab interaction`);
      continue;
    }
    console.log(`[V46.11 PERF] ${route} ${name}=${value.toFixed(name === "CLS" ? 4 : 1)} ${verdict(name, value)}`);
    expect(value, `${route} ${name} crossed POOR release blocker`).toBeLessThanOrEqual(thresholds[name].poor);
  }
}

test("V46.11 production-build lab scan: LCP / INP / CLS / TTFB", async ({ page, request }) => {
  await installObservers(page);

  for (const route of ["/", "/auth?mode=login"]) {
    await request.get(route); // warm server/compiler-independent production route
    await page.goto(route, { waitUntil: "networkidle" });

    if (route.startsWith("/auth")) {
      const email = page.getByLabel("E-posta");
      await email.fill("performance@example.test");
      await email.press("Tab");
      await page.getByRole("button", { name: "Kayıt Ol" }).first().click();
      await page.getByRole("button", { name: "Giriş Yap" }).first().click();
    }

    await page.waitForTimeout(600);
    const metrics = await readVitals(page);
    assertNotPoor(route, metrics);
  }
});
