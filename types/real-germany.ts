export type RealGermanyLevel = "A1" | "A2" | "B1" | "B2";

export type RealGermanyStepKind = "READ" | "LISTEN" | "FORM" | "WRITE" | "SPEAK";
export type RealGermanySkill = "READING" | "LISTENING" | "FORM" | "WRITING";
export type RealGermanyStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type RealGermanyEvaluationMode = "AI" | "HEURISTIC_FALLBACK";

export interface RealGermanyStep {
  id: string;
  kind: RealGermanyStepKind;
  title: string;
  instruction: string;
  prompt: string;
  helper?: string;
  placeholder?: string;
  requiredResponse?: boolean;
}

export interface RealGermanyScenario {
  id: string;
  level: RealGermanyLevel;
  category: string;
  title: string;
  summary: string;
  goal: string;
  city: string;
  estimatedMinutes: number;
  difficulty: "Başlangıç" | "Günlük" | "Orta" | "Yoğun";
  tags: string[];
  vocabulary: string[];
  supportPhrases: string[];
  successChecklist: string[];
  steps: RealGermanyStep[];
}

export interface RealGermanySkillScore {
  skill: RealGermanySkill;
  score: number;
  feedback: string;
}

export interface RealGermanyWeakArea {
  code: string;
  label: string;
  skill: RealGermanySkill;
  severity: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  excerpt?: string;
  nextReviewDays: number;
}

export interface RealGermanyComparison {
  previousAttemptNumber: number | null;
  previousOverallScore: number | null;
  overallDelta: number;
  readingDelta: number;
  listeningDelta: number;
  formDelta: number;
  writingDelta: number;
}

export interface RealGermanyEvaluationResult {
  attemptId: string;
  attemptNumber: number;
  scenarioId: string;
  overallScore: number;
  readingScore: number;
  listeningScore: number;
  formScore: number;
  writingScore: number;
  skillScores: RealGermanySkillScore[];
  strengths: string[];
  weakAreas: RealGermanyWeakArea[];
  nextStep: string;
  comparison: RealGermanyComparison;
  smartReviewQueued: number;
  evaluationMode: RealGermanyEvaluationMode;
  aiModel: string | null;
  createdAt: string;
}

export interface RealGermanyProgressSummary {
  scenarioId: string;
  level: RealGermanyLevel;
  status: RealGermanyStatus;
  currentStep: number;
  draftResponses: Record<string, string>;
  latestAttemptNumber: number;
  latestOverallScore: number | null;
  bestOverallScore: number;
  completedCount: number;
  startedAt: string | null;
  lastAttemptAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  latestResult: RealGermanyEvaluationResult | null;
}

export interface RealGermanyProgressResponse {
  progress: RealGermanyProgressSummary[];
}

export interface RealGermanySaveDraftRequest {
  scenarioId: string;
  level: RealGermanyLevel;
  responses: Record<string, string>;
  currentStep: number;
  action?: "SAVE" | "RETRY";
}

export interface RealGermanyEvaluateRequest {
  scenarioId: string;
  level: RealGermanyLevel;
  responses: Record<string, string>;
  durationSeconds?: number;
}
