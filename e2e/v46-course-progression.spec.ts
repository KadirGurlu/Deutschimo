import { expect, test } from "@playwright/test";
import {
  cleanupUser,
  completeOnboarding,
  login,
  prisma,
  registerToOnboarding,
  v46Email,
} from "./helpers/v46-user";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("V46.2 A1 -> A2 -> B1 -> B2 course progression persistence and idempotency", async ({ page, browser }) => {
  const email = v46Email("progress");

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "IMPROVE",
      daily: 30,
      days: 5,
      skills: ["GRAMMAR"],
    });

    for (const course of ["a1", "a2", "b1", "b2"]) {
      const response = await page.goto(`/courses/${course}`);
      expect(response?.status() ?? 500).toBeLessThan(400);
      await expect(page.locator("body")).toContainText(new RegExp(course.toUpperCase(), "i"));
    }

    const now = new Date().toISOString();
    const unitIds = ["a1-u01", "a2-u01", "b1-u01", "b2-u01"];
    const enrollments = ["a1", "a2", "b1", "b2"].map((courseId) => ({
      id: `v46-enroll-${courseId}`,
      userId: "browser",
      courseId,
      status: "ACTIVE",
      enrolledAt: now,
    }));

    const unitProgress = Object.fromEntries(
      unitIds.map((unitId) => [
        unitId,
        {
          id: `v46-progress-${unitId}`,
          userId: "browser",
          unitId,
          status: "COMPLETED",
          stage: "COMPLETED",
          lessonProgress: 100,
          exerciseProgress: 100,
          quizProgress: 100,
          totalProgress: 100,
          completedSlideIds: [],
          completedExerciseIds: [],
          startedAt: now,
          completedAt: now,
          lastVisitedAt: now,
          bestQuizScore: 100,
        },
      ]),
    );

    const activities = unitIds.map((unitId) => ({
      id: `v46-unit-completed-${unitId}`,
      userId: "browser",
      eventType: "UNIT_COMPLETED",
      courseId: unitId.slice(0, 2),
      unitId,
      createdAt: now,
    }));

    const learningPositions = Object.fromEntries(
      ["a1", "a2", "b1", "b2"].map((courseId) => [
        courseId,
        {
          userId: "browser",
          courseId,
          unitId: `${courseId}-u01`,
          stage: "COMPLETED",
          updatedAt: now,
        },
      ]),
    );

    const state = {
      userId: "browser",
      enrollments,
      unitProgress,
      slideProgress: {},
      exerciseAttempts: [],
      quizAttempts: [],
      learningPositions,
      activities,
      studySessions: [],
    };

    async function putState() {
      return page.evaluate(async (payload) => {
        const response = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: payload }),
        });
        return { status: response.status, body: await response.json() };
      }, state);
    }

    expect((await putState()).status).toBe(200);
    // Same logical completion twice must stay idempotent.
    expect((await putState()).status).toBe(200);

    const first = await page.evaluate(async () => {
      const response = await fetch("/api/progress");
      return { status: response.status, body: await response.json() };
    });

    expect(first.status).toBe(200);
    for (const unitId of unitIds) {
      expect(first.body.state.unitProgress[unitId].totalProgress).toBe(100);
      expect(first.body.state.unitProgress[unitId].status).toBe("COMPLETED");
    }

    const completedActivities = first.body.state.activities.filter(
      (item: { eventType?: string; id?: string }) => item.eventType === "UNIT_COMPLETED",
    );
    const completedIds = completedActivities.map((item: { id?: string }) => item.id);
    expect(new Set(completedIds).size).toBe(completedIds.length);

    // Refresh cannot lose progress.
    await page.reload();
    const refreshed = await page.evaluate(async () => {
      const response = await fetch("/api/progress");
      return { status: response.status, body: await response.json() };
    });
    expect(refreshed.status).toBe(200);
    for (const unitId of unitIds) {
      expect(refreshed.body.state.unitProgress[unitId].totalProgress).toBe(100);
    }

    // Published content route should work; unknown/unpublished content should not leak.
    const published = await page.request.get("/api/content/unit/a1-u01");
    expect(published.status()).toBe(200);
    const missing = await page.request.get("/api/content/unit/__v46-not-published__");
    expect(missing.status()).toBe(404);

    // Simulate another device/browser and confirm server-side progress persistence.
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await login(secondPage, email);
    await expect(secondPage).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    const fromSecondDevice = await secondPage.evaluate(async () => {
      const response = await fetch("/api/progress");
      return { status: response.status, body: await response.json() };
    });
    expect(fromSecondDevice.status).toBe(200);
    for (const unitId of unitIds) {
      expect(fromSecondDevice.body.state.unitProgress[unitId].totalProgress).toBe(100);
    }
    await secondContext.close();
  } finally {
    await cleanupUser(email);
  }
});
