export type SkillType = "LISTENING" | "SPEAKING" | "READING" | "WRITING";
export type LabLevel = "A1" | "A2" | "B1" | "B2";

export type ChoiceOption = { id: string; label: string };
export type ComprehensionQuestion = {
  id: string;
  kind: "MAIN_IDEA" | "DETAIL" | "INFERENCE" | "ATTITUDE";
  prompt: string;
  options: ChoiceOption[];
  correctAnswer: string;
  explanation: string;
  masteryQuestionId?: string;
  masteryTags?: string[];
};

export type ListeningKeyword = {
  de: string;
  tr: string;
};

export type ListeningPlaybackMode = "NORMAL" | "SLOW_75" | "REPEAT";

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
  unitId?: string;
  keywords?: ListeningKeyword[];
  dictationSegments?: string[];
  shadowingSegments?: string[];
  normalRate?: number;
  slowRate?: number;
  sourceVersion?: "V33" | "V34" | "V35" | "V36";
  sourceMethod?: string;
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

export type SpeakingCommunicationGoal = {
  id: string;
  label: string;
  keywords: string[];
};

export type SpeakingNaturalAlternative = {
  trigger: string;
  suggestion: string;
  reason: string;
};

export type SpeakingTask = {
  id: string;
  level: LabLevel;
  title: string;
  situation: string;
  prompt: string;
  preparation: string[];
  requiredKeywords: string[];
  communicationGoals: SpeakingCommunicationGoal[];
  grammarTargets: string[];
  naturalAlternatives: SpeakingNaturalAlternative[];
  pronunciationTargets: string[];
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

export type SpeakingPronunciationFeedback = {
  band: "CLEAR" | "CHECK" | "RETRY";
  label: string;
  note: string;
  focusWords: string[];
};

export type SpeakingNaturalSuggestion = {
  original: string;
  suggestion: string;
  reason: string;
};

export type SpeakingGrammarNote = {
  label: string;
  suggestion: string;
};

export type SpeakingEvaluation = {
  overall: number;
  taskCompletion: number;
  vocabulary: number;
  fluency: number;
  grammar: number;
  clarity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  achievedGoals: string[];
  missingGoals: string[];
  pronunciationFocus: string[];
  pronunciation: SpeakingPronunciationFeedback;
  naturalSuggestions: SpeakingNaturalSuggestion[];
  grammarNotes: SpeakingGrammarNote[];
  metrics: {
    wordCount: number;
    wordsPerMinute: number;
    hesitationCount: number;
    durationSeconds: number;
  };
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
