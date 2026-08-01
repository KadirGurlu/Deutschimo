export type VocabularyRating = "FORGOT" | "HARD" | "GOOD" | "EASY";
export type VocabularyReviewMode =
  | "DE_TO_TR"
  | "TR_TO_DE"
  | "AUDIO_TO_WORD"
  | "FILL_BLANK"
  | "ARTICLE"
  | "PLURAL"
  | "SENTENCE";

export type VerbConjugation = {
  ich?: string;
  du?: string;
  erSieEs?: string;
  wir?: string;
  ihr?: string;
  sieSie?: string;
};

export type VocabularyRecord = {
  id: string;
  word: string;
  article?: string | null;
  plural?: string | null;
  translation: string;
  pronunciation?: string | null;
  wordType?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  verbConjugation?: VerbConjugation | null;
  perfectForm?: string | null;
  governedPreposition?: string | null;
  sourceSkill: string;
  sourceTaskId: string;
  sourceCourseId?: string | null;
  sourceUnitId?: string | null;
  sourceUnitTitle?: string | null;
  notes?: string | null;
  mastery: number;
  nextReviewAt: string;
  lastReviewedAt?: string | null;
  reviewCount: number;
  correctStreak: number;
  lapseCount: number;
  intervalDays: number;
  easeFactor: number;
  lastRating?: VocabularyRating | null;
  suspended: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyStats = {
  total: number;
  due: number;
  newCount: number;
  learning: number;
  mastered: number;
  averageMastery: number;
  reviewedToday: number;
  currentStreak: number;
};

export type VocabularyReviewCard = {
  itemId: string;
  mode: VocabularyReviewMode;
  prompt: string;
  hint?: string;
  audioText?: string;
  options?: string[];
  selfAssessment?: boolean;
  sourceUnitTitle?: string | null;
  mastery: number;
  reviewCount: number;
  lapseCount: number;
};

export type VocabularyReviewResult = {
  correct: boolean;
  expected: string;
  acceptedAnswers: string[];
  explanation: string;
  modelSentence?: string | null;
};

export type VocabularyRecentAttempt = {
  id: string;
  itemId: string;
  word: string;
  mode: VocabularyReviewMode;
  rating: VocabularyRating;
  correct: boolean;
  responseMs?: number | null;
  createdAt: string;
};
