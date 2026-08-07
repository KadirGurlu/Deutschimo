import type { Level } from "@prisma/client";
import type { LearningGoal, OnboardingFocusSkill, OnboardingLevelChoice, OnboardingPlan } from "@/types/onboarding";

export const levelChoiceLabels: Record<OnboardingLevelChoice, string> = {
  BEGINNER: "Hiç bilmiyorum",
  SOME: "Biraz biliyorum",
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  UNSURE: "Emin değilim",
};

export const learningGoalLabels: Record<LearningGoal, string> = {
  GERMANY_LIFE: "Almanya'da yaşamak",
  UNIVERSITY: "Üniversite",
  WORK: "İş hayatı",
  DAILY_GERMAN: "Günlük Almanca",
  TESTDAF: "TestDaF",
  TELC: "TELC",
  GOETHE: "Goethe",
  IMPROVE: "Almancamı geliştirmek",
};

export const focusSkillLabels: Record<OnboardingFocusSkill, string> = {
  VOCABULARY: "Kelime",
  GRAMMAR: "Gramer",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};

const courseHours: Record<Level, number> = { A1: 25, A2: 35, B1: 45, B2: 55 };

export function resolveOnboardingLevel(choice: OnboardingLevelChoice, placementLevel?: Level | null): { level: Level; source: OnboardingPlan["source"] } | null {
  if (choice === "UNSURE") return placementLevel ? { level: placementLevel, source: "PLACEMENT_TEST" } : null;
  if (choice === "BEGINNER" || choice === "SOME") return { level: "A1", source: "SELF_REPORTED" };
  return { level: choice, source: "SELF_REPORTED" };
}

export function buildOnboardingPlan(input: {
  levelChoice: OnboardingLevelChoice;
  learningGoal: LearningGoal;
  dailyMinutes: number;
  studyDaysPerWeek: number;
  focusSkills: OnboardingFocusSkill[];
  placementLevel?: Level | null;
}): OnboardingPlan {
  const resolved = resolveOnboardingLevel(input.levelChoice, input.placementLevel);
  if (!resolved) throw new Error("PLACEMENT_REQUIRED");
  const weeklyMinutes = input.dailyMinutes * input.studyDaysPerWeek;
  const estimatedCompletionWeeks = Math.max(1, Math.ceil((courseHours[resolved.level] * 60) / weeklyMinutes));
  const focusLabels = input.focusSkills.map((item) => focusSkillLabels[item]);
  const priorityText = focusLabels.length ? focusLabels.join(" ve ") : "Dengeli çalışma";
  return {
    level: resolved.level,
    levelLabel: resolved.level,
    goal: input.learningGoal,
    goalLabel: learningGoalLabels[input.learningGoal],
    dailyMinutes: input.dailyMinutes,
    studyDaysPerWeek: input.studyDaysPerWeek,
    weeklyMinutes,
    estimatedCompletionWeeks,
    focusSkills: input.focusSkills,
    focusLabels,
    priorityText,
    suggestedCourseHref: `/courses/${resolved.level.toLowerCase()}`,
    source: resolved.source,
  };
}
