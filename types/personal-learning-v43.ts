import type { IntelligenceLevel } from "@/types/intelligence";
import type { LearningGoal, OnboardingFocusSkill } from "@/types/onboarding";

export const PERSONAL_LEARNING_SKILLS = [
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
  "WRITING",
  "SPEAKING",
] as const;

export type PersonalLearningSkill = typeof PERSONAL_LEARNING_SKILLS[number];

export type PersonalLearningReasonCode =
  | "ONBOARDING_FOCUS"
  | "LEARNING_GOAL"
  | "LOW_MASTERY"
  | "RECENT_LOW_SCORE"
  | "OPEN_ERRORS"
  | "DUE_REVIEW"
  | "LONG_GAP"
  | "BALANCE"
  | "COURSE_CONTINUITY";

export type PersonalLearningSignal = {
  skill: PersonalLearningSkill;
  priorityScore: number;
  priorityBand: "HIGH" | "MEDIUM" | "BALANCED";
  masteryScore: number | null;
  masteryConfidence: number;
  evidenceCount: number;
  recentAverage: number | null;
  recentAttempts: number;
  openErrorCount: number;
  dueReviewCount: number;
  daysSincePractice: number | null;
  reasons: string[];
  reasonCodes: PersonalLearningReasonCode[];
};

export type PersonalLearningProfile = {
  level: IntelligenceLevel;
  learningGoal: LearningGoal | null;
  goalLabel: string;
  dailyMinutes: number;
  studyDaysPerWeek: number;
  weeklyMinutes: number;
  focusSkills: OnboardingFocusSkill[];
  focusLabels: string[];
};

export type PersonalLearningDecision = {
  version: "V43";
  mode: "PROFILE_LED" | "ADAPTIVE";
  dataCoverage: number;
  profile: PersonalLearningProfile;
  primarySkill: PersonalLearningSkill;
  secondarySkill: PersonalLearningSkill;
  severeFocus: boolean;
  signals: PersonalLearningSignal[];
  reasons: string[];
  generatedAt: string;
};

export type PersonalLearningRawSignal = {
  skill: PersonalLearningSkill;
  masteryScore?: number | null;
  masteryConfidence?: number | null;
  evidenceCount?: number;
  recentAverage?: number | null;
  recentAttempts?: number;
  openErrorCount?: number;
  dueReviewCount?: number;
  daysSincePractice?: number | null;
};
