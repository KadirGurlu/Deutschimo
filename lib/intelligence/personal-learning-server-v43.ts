import { Level } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildPersonalLearningDecision } from "@/lib/intelligence/personal-learning-v43";
import {
  PERSONAL_LEARNING_SKILLS,
  type PersonalLearningDecision,
  type PersonalLearningRawSignal,
  type PersonalLearningSkill,
} from "@/types/personal-learning-v43";
import {
  learningGoals,
  onboardingFocusSkills,
  type LearningGoal,
  type OnboardingFocusSkill,
} from "@/types/onboarding";
import type { IntelligenceLevel } from "@/types/intelligence";

const skillSet = new Set<string>(PERSONAL_LEARNING_SKILLS);
const focusSet = new Set<string>(onboardingFocusSkills);
const learningGoalSet = new Set<string>(learningGoals);

function asSkill(value: unknown): PersonalLearningSkill | null {
  const normalized = String(value ?? "").toUpperCase();
  return skillSet.has(normalized) ? normalized as PersonalLearningSkill : null;
}

function daysSince(value: Date | null | undefined) {
  if (!value) return null;
  return Math.max(0, Math.round((Date.now() - value.getTime()) / 86_400_000));
}

export async function getPersonalLearningDecisionForUser(args: {
  userId: string;
  currentLevel: IntelligenceLevel;
  fallbackDailyMinutes: number;
}): Promise<PersonalLearningDecision> {
  const courseId = args.currentLevel.toLowerCase();
  const since = new Date(Date.now() - 21 * 86_400_000);
  const now = new Date();

  const [profile, masteryRows, recentLabs, openErrors, dueReviewRows, dueVocabularyCount] =
    await Promise.all([
      prisma.learnerOnboardingProfile.findUnique({
        where: { userId: args.userId },
        select: {
          learningGoal: true,
          dailyMinutes: true,
          studyDaysPerWeek: true,
          focusSkills: true,
          resolvedLevel: true,
        },
      }),
      prisma.masterySkillSnapshot.findMany({
        where: { userId: args.userId, courseId, unitId: null },
        select: {
          skill: true,
          score: true,
          confidence: true,
          evidenceCount: true,
          lastEvidenceAt: true,
        },
      }),
      prisma.skillLabAttempt.findMany({
        where: {
          userId: args.userId,
          level: args.currentLevel as Level,
          completedAt: { gte: since },
        },
        orderBy: { completedAt: "desc" },
        take: 80,
        select: { skill: true, score: true, completedAt: true },
      }),
      prisma.learningErrorHistory.findMany({
        where: { userId: args.userId, courseId, resolvedAt: null },
        select: { skill: true, occurrenceCount: true, lastOccurredAt: true },
      }),
      prisma.masteryReviewQueueItem.findMany({
        where: {
          userId: args.userId,
          courseId,
          status: "ACTIVE",
          dueAt: { lte: now },
        },
        select: { skill: true, priorityScore: true, updatedAt: true },
      }),
      prisma.vocabularyNotebookItem.count({
        where: {
          userId: args.userId,
          suspended: false,
          nextReviewAt: { lte: now },
        },
      }),
    ]);

  const mastery = new Map<PersonalLearningSkill, {
    score: number;
    confidence: number;
    evidenceCount: number;
    lastEvidenceAt: Date | null;
  }>();
  for (const row of masteryRows) {
    const skill = asSkill(row.skill);
    if (!skill) continue;
    mastery.set(skill, {
      score: row.score,
      confidence: row.confidence,
      evidenceCount: row.evidenceCount,
      lastEvidenceAt: row.lastEvidenceAt,
    });
  }

  const labScores = new Map<PersonalLearningSkill, number[]>();
  const labLastAt = new Map<PersonalLearningSkill, Date>();
  for (const row of recentLabs) {
    const skill = asSkill(row.skill);
    if (!skill) continue;
    const list = labScores.get(skill) ?? [];
    list.push(row.score);
    labScores.set(skill, list);
    if (!labLastAt.has(skill)) labLastAt.set(skill, row.completedAt);
  }

  const errorCounts = new Map<PersonalLearningSkill, number>();
  const errorLastAt = new Map<PersonalLearningSkill, Date>();
  for (const row of openErrors) {
    const skill = asSkill(row.skill);
    if (!skill) continue;
    errorCounts.set(skill, (errorCounts.get(skill) ?? 0) + row.occurrenceCount);
    const previous = errorLastAt.get(skill);
    if (!previous || row.lastOccurredAt > previous) errorLastAt.set(skill, row.lastOccurredAt);
  }

  const reviewCounts = new Map<PersonalLearningSkill, number>();
  for (const row of dueReviewRows) {
    const skill = asSkill(row.skill);
    if (!skill) continue;
    // High-priority queue items count slightly more without exploding the plan.
    const weight = row.priorityScore >= 70 ? 2 : 1;
    reviewCounts.set(skill, (reviewCounts.get(skill) ?? 0) + weight);
  }
  reviewCounts.set("VOCABULARY", (reviewCounts.get("VOCABULARY") ?? 0) + Math.min(8, dueVocabularyCount));

  const rawSignals: PersonalLearningRawSignal[] = PERSONAL_LEARNING_SKILLS.map((skill) => {
    const master = mastery.get(skill);
    const scores = labScores.get(skill) ?? [];
    const latestDates = [
      master?.lastEvidenceAt ?? null,
      labLastAt.get(skill) ?? null,
      errorLastAt.get(skill) ?? null,
    ].filter((value): value is Date => Boolean(value));
    const latest = latestDates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      skill,
      masteryScore: master?.score ?? null,
      masteryConfidence: master?.confidence ?? 0,
      evidenceCount: master?.evidenceCount ?? 0,
      recentAverage: scores.length
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
        : null,
      recentAttempts: scores.length,
      openErrorCount: errorCounts.get(skill) ?? 0,
      dueReviewCount: reviewCounts.get(skill) ?? 0,
      daysSincePractice: daysSince(latest),
    };
  });

  const focusSkills = Array.isArray(profile?.focusSkills)
    ? profile.focusSkills
        .filter((item): item is string => typeof item === "string" && focusSet.has(item))
        .map((item) => item as OnboardingFocusSkill)
    : [];

  const learningGoal =
    typeof profile?.learningGoal === "string" && learningGoalSet.has(profile.learningGoal)
      ? profile.learningGoal as LearningGoal
      : null;

  return buildPersonalLearningDecision({
    level: args.currentLevel,
    learningGoal,
    dailyMinutes: profile?.dailyMinutes ?? args.fallbackDailyMinutes,
    studyDaysPerWeek: profile?.studyDaysPerWeek ?? 5,
    focusSkills,
    rawSignals,
  });
}
