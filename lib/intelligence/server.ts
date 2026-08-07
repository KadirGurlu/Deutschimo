import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  analyzeLearningState,
  buildReviewQueue,
  type PersonalizedErrorSignal,
  type StoredReviewItem,
} from "@/lib/intelligence/insight-engine";
import { buildDailyPlan } from "@/lib/intelligence/daily-plan";
import type { DailyPlanTask, DailyStudyPlan, IntelligenceInsights, IntelligenceLevel, PlacementResult } from "@/types/intelligence";
import type { LearningState } from "@/types/progress";
import { onboardingFocusSkills, type OnboardingFocusSkill } from "@/types/onboarding";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const focusSkillSet = new Set<string>(onboardingFocusSkills);

export async function readLearningState(userId: string): Promise<LearningState | null> {
  const snapshot = await prisma.learningStateSnapshot.findUnique({ where: { userId }, select: { state: true } });
  return (snapshot?.state as unknown as LearningState | undefined) ?? null;
}
export async function refreshInsights(userId: string, stateOverride?: LearningState | null): Promise<IntelligenceInsights> {
  const state = stateOverride === undefined ? await readLearningState(userId) : stateOverride;
  const insights = analyzeLearningState(state);
  await prisma.learningInsightSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      weakTopics: insights.weakTopics as unknown as Prisma.InputJsonValue,
      strengths: insights.strengths as unknown as Prisma.InputJsonValue,
      hasEnoughData: insights.hasEnoughData,
      sourceVersion: 23,
      generatedAt: new Date(insights.generatedAt),
    },
    update: {
      weakTopics: insights.weakTopics as unknown as Prisma.InputJsonValue,
      strengths: insights.strengths as unknown as Prisma.InputJsonValue,
      hasEnoughData: insights.hasEnoughData,
      sourceVersion: 23,
      generatedAt: new Date(insights.generatedAt),
    },
  });
  return insights;
}
export async function latestPlacement(userId: string): Promise<PlacementResult | null> {
  const result = await prisma.placementAssessment.findFirst({ where: { userId }, orderBy: { completedAt: "desc" } });
  if (!result) return null;
  return {
    id: result.id,
    recommendedLevel: result.recommendedLevel,
    totalScore: result.totalScore,
    correctCount: result.correctCount,
    questionCount: result.questionCount,
    levelScores: result.levelScores as unknown as PlacementResult["levelScores"],
    strengths: result.strengths as unknown as string[],
    weakTopics: result.weakTopics as unknown as string[],
    completedAt: result.completedAt.toISOString(),
  };
}
async function readOpenErrorSignals(userId: string): Promise<PersonalizedErrorSignal[]> {
  const errors = await prisma.learningErrorHistory.findMany({
    where: { userId, resolvedAt: null },
    orderBy: [{ occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
    take: 30,
    select: {
      id: true, sourceType: true, sourceId: true, courseId: true, unitId: true, level: true, skill: true,
      objectiveCode: true, topic: true, correctAnswer: true, explanation: true, relatedSlideId: true,
      occurrenceCount: true, lastOccurredAt: true,
    },
  });
  return errors.map((error) => ({
    ...error,
    correctAnswer: error.correctAnswer as unknown,
    lastOccurredAt: error.lastOccurredAt.toISOString(),
  }));
}
export async function getOrRefreshReviewState(userId: string, force = false) {
  const [existing, stateSnapshot, latestOpenError] = await Promise.all([
    prisma.smartReviewState.findUnique({ where: { userId } }),
    prisma.learningStateSnapshot.findUnique({ where: { userId }, select: { state: true, updatedAt: true } }),
    prisma.learningErrorHistory.findFirst({
      where: { userId, resolvedAt: null },
      orderBy: { lastOccurredAt: "desc" },
      select: { lastOccurredAt: true },
    }),
  ]);
  const newestLearningSignal = [stateSnapshot?.updatedAt, latestOpenError?.lastOccurredAt]
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const isFresh = Boolean(
    existing
      && Date.now() - existing.generatedAt.getTime() < 30 * 60 * 1000
      && (!newestLearningSignal || existing.generatedAt.getTime() >= newestLearningSignal.getTime()),
  );
  if (existing && isFresh && !force) {
    return {
      queue: existing.queue as unknown as StoredReviewItem[],
      completedIds: existing.completedIds as string[],
      attempts: existing.attempts as Record<string, number>,
    };
  }
  const state = (stateSnapshot?.state as unknown as LearningState | undefined) ?? null;
  const [insights, errorHistory] = await Promise.all([
    refreshInsights(userId, state),
    readOpenErrorSignals(userId),
  ]);
  const queue = buildReviewQueue(state, insights, errorHistory);
  const completedIds = force
    ? []
    : ((existing?.completedIds as string[] | undefined) ?? []).filter((id) => queue.some((item) => item.id === id));
  const attempts = force ? {} : ((existing?.attempts as Record<string, number> | undefined) ?? {});
  const saved = await prisma.smartReviewState.upsert({
    where: { userId },
    create: { userId, queue: jsonValue(queue), completedIds: jsonValue(completedIds), attempts: jsonValue(attempts) },
    update: { queue: jsonValue(queue), completedIds: jsonValue(completedIds), attempts: jsonValue(attempts), generatedAt: new Date() },
  });
  return {
    queue: saved.queue as unknown as StoredReviewItem[],
    completedIds: saved.completedIds as string[],
    attempts: saved.attempts as Record<string, number>,
  };
}
export async function getOrCreateDailyPlan(args: {
  userId: string;
  planDate: string;
  goalMinutes: number;
  currentLevel: IntelligenceLevel;
  force?: boolean;
}): Promise<DailyStudyPlan> {
  const [existing, onboardingProfile] = await Promise.all([
    prisma.dailyStudyPlan.findUnique({ where: { userId_planDate: { userId: args.userId, planDate: args.planDate } } }),
    prisma.learnerOnboardingProfile.findUnique({
      where: { userId: args.userId },
      select: { levelChoice: true, focusSkills: true, completedAt: true },
    }),
  ]);
  const existingTasks = existing?.tasks as unknown as DailyPlanTask[] | undefined;
  const isV321Plan = Boolean(existingTasks?.length && existingTasks.every((task) => task.id.includes("-v32-1-")));
  if (existing && !args.force && isV321Plan) {
    const tasks = existingTasks ?? [];
    return {
      id: existing.id,
      planDate: existing.planDate,
      goalMinutes: existing.goalMinutes,
      plannedMinutes: existing.plannedMinutes,
      completedMinutes: existing.completedMinutes,
      tasks,
      generatedAt: existing.generatedAt.toISOString(),
    };
  }
  const [state, insights, placement, review] = await Promise.all([
    readLearningState(args.userId),
    refreshInsights(args.userId),
    latestPlacement(args.userId),
    getOrRefreshReviewState(args.userId),
  ]);
  const remaining = review.queue.filter((item) => !review.completedIds.includes(item.id)).length;
  const focusSkills = Array.isArray(onboardingProfile?.focusSkills)
    ? onboardingProfile.focusSkills.filter((item): item is OnboardingFocusSkill => typeof item === "string" && focusSkillSet.has(item))
    : [];
  const selfReportedLevelReady = Boolean(
    onboardingProfile?.completedAt
      && onboardingProfile.levelChoice
      && onboardingProfile.levelChoice !== "UNSURE",
  );
  const plan = buildDailyPlan({
    planDate: args.planDate,
    goalMinutes: args.goalMinutes,
    currentLevel: args.currentLevel,
    state,
    insights,
    reviewRemaining: remaining,
    hasPlacement: Boolean(placement),
    selfReportedLevelReady,
    focusSkills,
  });
  const saved = await prisma.dailyStudyPlan.upsert({
    where: { userId_planDate: { userId: args.userId, planDate: args.planDate } },
    create: {
      userId: args.userId,
      planDate: plan.planDate,
      goalMinutes: plan.goalMinutes,
      plannedMinutes: plan.plannedMinutes,
      completedMinutes: plan.completedMinutes,
      tasks: jsonValue(plan.tasks),
    },
    update: {
      goalMinutes: plan.goalMinutes,
      plannedMinutes: plan.plannedMinutes,
      completedMinutes: plan.completedMinutes,
      tasks: jsonValue(plan.tasks),
      generatedAt: new Date(),
    },
  });
  return { ...plan, id: saved.id, generatedAt: saved.generatedAt.toISOString() };
}
