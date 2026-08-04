export type IntelligenceLevel = "A1" | "A2" | "B1" | "B2";

export type PlacementSkill = "GRAMMAR" | "VOCABULARY" | "READING" | "COMMUNICATION";

export type PlacementQuestion = {
  id: string;
  level: IntelligenceLevel;
  topic: string;
  skill: PlacementSkill;
  prompt: string;
  options: Array<{ id: string; label: string; value: string }>;
  correctAnswer: string;
  explanation: string;
};

export type PlacementResult = {
  id?: string;
  recommendedLevel: IntelligenceLevel;
  totalScore: number;
  correctCount: number;
  questionCount: number;
  levelScores: Record<IntelligenceLevel, number>;
  strengths: string[];
  weakTopics: string[];
  completedAt: string;
};

export type WeakTopicInsight = {
  id: string;
  unitId: string;
  courseId: string;
  unitTitle: string;
  skill: string;
  accuracy: number;
  attemptCount: number;
  incorrectCount: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
  href: string;
};

export type StrengthInsight = {
  id: string;
  title: string;
  accuracy: number;
  attemptCount: number;
};

export type IntelligenceInsights = {
  weakTopics: WeakTopicInsight[];
  strengths: StrengthInsight[];
  generatedAt: string;
  hasEnoughData: boolean;
};

export type ReviewConfidence = "UNSURE" | "SURE";
export type ReviewPracticeMode =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "TRANSLATION"
  | "NEW_SENTENCE"
  | "CONCEPT";

export type ReviewItemType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK" | "TRANSLATION" | "CONCEPT";

export type ReviewItem = {
  id: string;
  sourceId: string;
  sourceType: "EXERCISE" | "QUIZ" | "INSIGHT" | "ERROR_HISTORY";
  courseId: string;
  unitId: string;
  unitTitle: string;
  skill: string;
  type: ReviewItemType;
  prompt: string;
  options?: Array<{ id: string; label: string; value: string }>;
  href: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM";
  reason?: string;
  occurrenceCount?: number;
  objectiveCode?: string;
  errorHistoryId?: string;
  reviewMode?: ReviewPracticeMode;
  difficulty?: number;
  mastery?: number;
  sameErrorStreak?: number;
  expectedSeconds?: number;
  nextReviewAt?: string | null;
  hint?: string;
};

export type ReviewScheduleSummary = {
  nextReviewAt: string;
  label: string;
  mastery: number;
  confidenceScore: number;
  signalScore: number;
  explanations: string[];
};

export type ReviewAnswerResult = {
  correct: boolean;
  explanation: string;
  correctAnswer?: string | boolean | string[];
  completedCount: number;
  totalCount: number;
  schedule?: ReviewScheduleSummary;
};

export type DailyPlanTaskType = "LESSON" | "REVIEW" | "QUIZ" | "VOCABULARY" | "WRITING" | "PLACEMENT" | "SKILL";

export type DailyPlanTask = {
  id: string;
  type: DailyPlanTaskType;
  title: string;
  description: string;
  minutes: number;
  href: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
  unitId?: string;
  courseId?: string;
};

export type DailyStudyPlan = {
  id?: string;
  planDate: string;
  goalMinutes: number;
  plannedMinutes: number;
  completedMinutes: number;
  tasks: DailyPlanTask[];
  generatedAt: string;
};

export type IntelligenceOverview = {
  placement: PlacementResult | null;
  insights: IntelligenceInsights;
  review: { total: number; completed: number; remaining: number };
  dailyPlan: DailyStudyPlan;
};
