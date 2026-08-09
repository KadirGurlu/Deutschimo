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

test("V46.3 Mastery Engine -> Smart Review -> Personal Learning -> Daily Plan integration", async ({ page }) => {
  const email = v46Email("learning");

  try {
    await registerToOnboarding(page, email);
    await completeOnboarding(page, {
      level: "A1",
      goal: "GERMANY_LIFE",
      daily: 30,
      days: 5,
      skills: ["LISTENING"],
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    if (!user) throw new Error("V46 test user missing");

    const taskId = `v46-low-listening-${Date.now()}`;

    const attempt = await page.evaluate(async ({ taskId }) => {
      const response = await fetch("/api/skills/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: "LISTENING",
          taskId,
          level: "A1",
          score: 20,
          durationSeconds: 45,
          answerPayload: {
            unitId: "a1-u01",
            answers: { v46: "wrong" },
            playCount: 2,
          },
          feedback: {
            unitId: "a1-u01",
            listeningScore: 20,
            comprehensionScore: 15,
            dictationScore: 25,
            questionResults: [
              {
                questionId: `${taskId}-q1`,
                masteryQuestionId: `${taskId}-q1`,
                masteryTags: ["hoeren-detail"],
                kind: "DETAIL",
                correct: false,
                selected: "wrong",
              },
            ],
          },
        }),
      });
      return {
        status: response.status,
        body: await response.json().catch(() => ({})),
      };
    }, { taskId });

    expect(attempt.status).toBeGreaterThanOrEqual(200);
    expect(attempt.status).toBeLessThan(300);

    await expect.poll(async () => {
      return prisma.masterySkillSnapshot.count({
        where: { userId: user.id, courseId: "a1", skill: "LISTENING" },
      });
    }, { timeout: 15_000 }).toBeGreaterThan(0);

    const mastery = await prisma.masterySkillSnapshot.findFirst({
      where: { userId: user.id, courseId: "a1", skill: "LISTENING" },
      orderBy: { updatedAt: "desc" },
    });
    expect(mastery).toBeTruthy();
    expect(mastery?.score ?? 101).toBeLessThanOrEqual(40);

    await expect.poll(async () => {
      return prisma.masteryReviewQueueItem.count({
        where: { userId: user.id, courseId: "a1", skill: "LISTENING", status: "ACTIVE" },
      });
    }, { timeout: 15_000 }).toBeGreaterThan(0);

    const queueCountBefore = await prisma.masteryReviewQueueItem.count({
      where: { userId: user.id, courseId: "a1", skill: "LISTENING", status: "ACTIVE" },
    });

    const personal = await page.evaluate(async () => {
      const response = await fetch("/api/intelligence/personal-learning");
      return { status: response.status, body: await response.json() };
    });
    expect(personal.status).toBe(200);
    expect(personal.body.decision.version).toBe("V43");

    const listeningSignal = personal.body.decision.signals.find(
      (item: { skill?: string }) => item.skill === "LISTENING",
    );
    expect(listeningSignal).toBeTruthy();
    expect(listeningSignal.masteryScore).not.toBeNull();

    const today = new Date().toISOString().slice(0, 10);
    const firstPlan = await page.evaluate(async (date) => {
      const response = await fetch(`/api/intelligence/daily-plan?date=${date}`);
      return { status: response.status, body: await response.json().catch(() => ({})) };
    }, today);
    expect(firstPlan.status).toBe(200);

    const persistedAfterFirst = await prisma.dailyStudyPlan.count({
      where: { userId: user.id },
    });

    // Same day request must not multiply plan records or review debt.
    const secondPlan = await page.evaluate(async (date) => {
      const response = await fetch(`/api/intelligence/daily-plan?date=${date}`);
      return { status: response.status, body: await response.json().catch(() => ({})) };
    }, today);
    expect(secondPlan.status).toBe(200);

    expect(await prisma.dailyStudyPlan.count({ where: { userId: user.id } }))
      .toBe(persistedAfterFirst);

    expect(await prisma.masteryReviewQueueItem.count({
      where: { userId: user.id, courseId: "a1", skill: "LISTENING", status: "ACTIVE" },
    })).toBe(queueCountBefore);

    // A next-day plan request must remain a valid operation.
    const tomorrowDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const tomorrow = await page.evaluate(async (date) => {
      const response = await fetch(`/api/intelligence/daily-plan?date=${date}`);
      return { status: response.status, body: await response.json().catch(() => ({})) };
    }, tomorrowDate);
    expect(tomorrow.status).toBe(200);
  } finally {
    await cleanupUser(email);
  }
});
