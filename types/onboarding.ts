export const onboardingLevelChoices = ["BEGINNER", "SOME", "A1", "A2", "B1", "B2", "UNSURE"] as const;
export type OnboardingLevelChoice = typeof onboardingLevelChoices[number];

export const learningGoals = ["GERMANY_LIFE", "UNIVERSITY", "WORK", "DAILY_GERMAN", "TESTDAF", "TELC", "GOETHE", "IMPROVE"] as const;
export type LearningGoal = typeof learningGoals[number];

export const onboardingFocusSkills = ["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "WRITING", "SPEAKING"] as const;
export type OnboardingFocusSkill = typeof onboardingFocusSkills[number];

export type OnboardingPlan = {
  level: "A1" | "A2" | "B1" | "B2";
  levelLabel: string;
  goal: LearningGoal;
  goalLabel: string;
  dailyMinutes: number;
  studyDaysPerWeek: number;
  weeklyMinutes: number;
  estimatedCompletionWeeks: number;
  focusSkills: OnboardingFocusSkill[];
  focusLabels: string[];
  priorityText: string;
  suggestedCourseHref: string;
  source: "SELF_REPORTED" | "PLACEMENT_TEST";
};

export type OnboardingSnapshot = {
  completed: boolean;
  profile: {
    levelChoice?: OnboardingLevelChoice;
    learningGoal?: LearningGoal;
    dailyMinutes?: number;
    studyDaysPerWeek?: number;
    focusSkills?: OnboardingFocusSkill[];
  } | null;
  latestPlacement: {
    recommendedLevel: "A1" | "A2" | "B1" | "B2";
    overallBand?: string;
    completedAt: string;
  } | null;
};
