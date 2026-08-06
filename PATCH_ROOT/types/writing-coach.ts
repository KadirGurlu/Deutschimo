export type WritingCoachLevel = "A1" | "A2" | "B1" | "B2";

export type WritingCoachRubricMode = "DEUTSCHIMO" | "GOETHE" | "TELC";

export type WritingErrorCategory =
  | "ARTICLE"
  | "DATIVE"
  | "ACCUSATIVE"
  | "VERB_POSITION"
  | "VERB_CONJUGATION"
  | "TENSE"
  | "PREPOSITION"
  | "WORD_ORDER"
  | "AGREEMENT"
  | "VOCABULARY"
  | "CONNECTOR"
  | "SPELLING"
  | "PUNCTUATION"
  | "TASK_FULFILLMENT"
  | "REGISTER"
  | "COHERENCE"
  | "OTHER";

export type WritingErrorSeverity = "LOW" | "MEDIUM" | "HIGH";

export type WritingRubricKey =
  | "taskFulfillment"
  | "grammarAccuracy"
  | "vocabularyRange"
  | "sentenceConnections"
  | "spellingPunctuation"
  | "levelAppropriateness";

export interface WritingCoachScenario {
  id: string;
  level: WritingCoachLevel;
  title: string;
  category: string;
  situation: string;
  prompt: string;
  requiredPoints: string[];
  usefulPhrases: string[];
  minWords: number;
  targetWords: number;
  maxWords: number;
}

export interface WritingRubricDimension {
  score: number;
  feedback: string;
}

export interface WritingRubricResult {
  taskFulfillment: WritingRubricDimension;
  grammarAccuracy: WritingRubricDimension;
  vocabularyRange: WritingRubricDimension;
  sentenceConnections: WritingRubricDimension;
  spellingPunctuation: WritingRubricDimension;
  levelAppropriateness: WritingRubricDimension;
}

export interface WritingCoachError {
  excerpt: string;
  category: WritingErrorCategory;
  label: string;
  severity: WritingErrorSeverity;
  explanation: string;
  hint: string;
  rewriteQuestion: string;
}

export interface WritingTaskCoverage {
  point: string;
  met: boolean;
  note: string;
}

export interface WritingLanguageSuggestion {
  item: string;
  turkishHint: string;
}

export interface WritingCoachFeedback {
  overallScore: number;
  rubric: WritingRubricResult;
  errors: WritingCoachError[];
  strengths: string[];
  taskCoverage: WritingTaskCoverage[];
  vocabularySuggestions: WritingLanguageSuggestion[];
  connectorSuggestions: WritingLanguageSuggestion[];
  nextStep: string;
  levelFit: string;
  evaluationModeNote: string;
}

export interface WritingRevisionComparison {
  initialScore: number;
  currentScore: number;
  overallDelta: number;
  previousScore: number | null;
  previousDelta: number | null;
  resolvedErrorCount: number;
  repeatedErrorCount: number;
  newErrorCount: number;
  rubricDelta: Record<WritingRubricKey, number>;
}

export interface WritingCoachRevisionSummary {
  id: string;
  revisionNumber: number;
  overallScore: number;
  improvement: number;
  errorCount: number;
  rubricMode: WritingCoachRubricMode;
  createdAt: string;
}

export interface WritingCoachReviewRequest {
  scenarioId: string;
  level: WritingCoachLevel;
  text: string;
  rubricMode: WritingCoachRubricMode;
  sessionId?: string;
  durationSeconds?: number;
}

export interface WritingCoachReviewResponse {
  sessionId: string;
  revisionNumber: number;
  feedback: WritingCoachFeedback;
  errorHistory: WritingErrorProfileView[];
  comparison: WritingRevisionComparison;
  revisionHistory: WritingCoachRevisionSummary[];
  initialText: string;
  currentText: string;
  smartReviewQueued: number;
}

export interface WritingErrorProfileView {
  category: WritingErrorCategory;
  label: string;
  count: number;
  lastExcerpt: string | null;
  lastScenarioId: string | null;
  lastSeenAt: string;
  nextReviewAt: string | null;
}

export interface WritingCoachAttemptSummary {
  id: string;
  scenarioId: string;
  level: WritingCoachLevel;
  revisionNumber: number;
  overallScore: number;
  improvement: number;
  errorCount: number;
  rubricMode: WritingCoachRubricMode;
  createdAt: string;
}
