export type SkillType = "LISTENING" | "SPEAKING" | "READING" | "WRITING";
export type LabLevel = "A1" | "A2" | "B1" | "B2";

export type ChoiceOption = { id: string; label: string };
export type ComprehensionQuestion = {
  id: string;
  kind: "MAIN_IDEA" | "DETAIL";
  prompt: string;
  options: ChoiceOption[];
  correctAnswer: string;
  explanation: string;
};

export type VocabularyItem = {
  word: string;
  article?: string;
  plural?: string;
  translation: string;
  example: string;
  exampleTranslation: string;
};

export type ListeningTask = {
  id: string;
  level: LabLevel;
  title: string;
  situation: string;
  speakerHint: string;
  estimatedMinutes: number;
  transcript: string;
  translation: string;
  questions: ComprehensionQuestion[];
  vocabulary: VocabularyItem[];
};

export type ReadingTask = {
  id: string;
  level: LabLevel;
  title: string;
  genre: string;
  estimatedMinutes: number;
  text: string;
  translation: string;
  questions: ComprehensionQuestion[];
  vocabulary: VocabularyItem[];
};

export type SpeakingTask = {
  id: string;
  level: LabLevel;
  title: string;
  situation: string;
  prompt: string;
  preparation: string[];
  requiredKeywords: string[];
  modelAnswer: string;
  estimatedSeconds: number;
};

export type WritingTask = {
  id: string;
  level: LabLevel;
  title: string;
  situation: string;
  prompt: string;
  minWords: number;
  maxWords: number;
  requiredPoints: string[];
  targetKeywords: string[];
  usefulPhrases: string[];
  modelAnswer: string;
};

export type SkillAttemptPayload = {
  skill: SkillType;
  taskId: string;
  level: LabLevel;
  score: number;
  durationSeconds?: number;
  answerPayload?: unknown;
  transcript?: string;
  feedback?: unknown;
};

export type SkillAttemptRecord = SkillAttemptPayload & {
  id: string;
  completedAt: string;
};

export type SkillOverview = {
  totals: Record<SkillType, number>;
  averages: Record<SkillType, number>;
  recent: SkillAttemptRecord[];
  vocabularyCount: number;
  vocabularyDueCount: number;
  vocabularyMasteredCount: number;
};

export type SpeakingEvaluation = {
  overall: number;
  taskCompletion: number;
  vocabulary: number;
  fluency: number;
  clarity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  pronunciationFocus: string[];
  feedback: string[];
};

export type WritingEvaluation = {
  overall: number;
  taskSuccess: number;
  grammar: number;
  vocabulary: number;
  structure: number;
  wordCount: number;
  matchedPoints: string[];
  missingPoints: string[];
  corrections: { original: string; suggestion: string; reason: string }[];
  feedback: string[];
};
