import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { analyzeLearningState, buildReviewQueue } from "@/lib/intelligence/insight-engine";
import { buildDailyPlan } from "@/lib/intelligence/daily-plan";
import type { DailyPlanTask, DailyStudyPlan, IntelligenceInsights, IntelligenceLevel, PlacementResult, ReviewItem } from "@/types/intelligence";
import type { LearningState } from "@/types/progress";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function readLearningState(userId: string): Promise<LearningState | null> {
  const snapshot = await prisma.learningStateSnapshot.findUnique({ where: { userId }, select: { state: true } });
  return (snapshot?.state as unknown as LearningState | undefined) ?? null;
}

export async function refreshInsights(userId: string): Promise<IntelligenceInsights> {
  const state = await readLearningState(userId);
  const insights = analyzeLearningState(state);
  await prisma.learningInsightSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      weakTopics: insights.weakTopics as unknown as Prisma.InputJsonValue,
      strengths: insights.strengths as unknown as Prisma.InputJsonValue,
      hasEnoughData: insights.hasEnoughData,
      sourceVersion: 12,
      generatedAt: new Date(insights.generatedAt),
    },
    update: {
      weakTopics: insights.weakTopics as unknown as Prisma.InputJsonValue,
      strengths: insights.strengths as unknown as Prisma.InputJsonValue,
      hasEnoughData: insights.hasEnoughData,
      sourceVersion: 12,
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

export type StoredReviewItem = ReviewItem & {
  correctAnswer?: unknown;
  acceptedAnswers?: string[];
  explanation: string;
};

export async function getOrRefreshReviewState(userId: string, force = false) {
  const existing = await prisma.smartReviewState.findUnique({ where: { userId } });
  const isFresh = existing && Date.now() - existing.generatedAt.getTime() < 12 * 60 * 60 * 1000;
  if (existing && isFresh && !force) {
    return {
      queue: existing.queue as unknown as StoredReviewItem[],
      completedIds: existing.completedIds as string[],
      attempts: existing.attempts as Record<string, number>,
    };
  }

  const state = await readLearningState(userId);
  const insights = await refreshInsights(userId);
  const queue = buildReviewQueue(state, insights);
  const completedIds = force ? [] : ((existing?.completedIds as string[] | undefined) ?? []).filter((id) => queue.some((item) => item.id === id));
  const attempts = force ? {} : ((existing?.attempts as Record<string, number> | undefined) ?? {});
  const saved = await prisma.smartReviewState.upsert({
    where: { userId },
    create: {
      userId,
      queue: jsonValue(queue),
      completedIds: jsonValue(completedIds),
      attempts: jsonValue(attempts),
    },
    update: {
      queue: jsonValue(queue),
      completedIds: jsonValue(completedIds),
      attempts: jsonValue(attempts),
      generatedAt: new Date(),
    },
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
  const existing = await prisma.dailyStudyPlan.findUnique({ where: { userId_planDate: { userId: args.userId, planDate: args.planDate } } });
  if (existing && !args.force) {
    const tasks = existing.tasks as unknown as DailyPlanTask[];
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
  const plan = buildDailyPlan({
    planDate: args.planDate,
    goalMinutes: args.goalMinutes,
    currentLevel: args.currentLevel,
    state,
    insights,
    reviewRemaining: remaining,
    hasPlacement: Boolean(placement),
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
