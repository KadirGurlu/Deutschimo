import type { BilingualLine, CommonMistake, DialogueTurn, PracticeQuestion, RichVocabularyItem } from "@/types/content";

export type LearningStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LOCKED";
export type UnitStage = "LESSONS" | "EXERCISES" | "QUIZ" | "REVIEW" | "COMPLETED";
export type SlideCompletionRule = "NEXT_CLICK" | "MINI_CHECK" | "MIN_TIME" | "MANUAL";
export type ContentBlockType =
  | "text"
  | "heading"
  | "example"
  | "translation"
  | "bilingual_examples"
  | "grammar_table"
  | "vocabulary_list"
  | "dialogue"
  | "reading_text"
  | "listening_text"
  | "task_card"
  | "mistake_list"
  | "practice_set"
  | "info_box"
  | "warning_box"
  | "tip_box"
  | "mini_check"
  | "summary"
  | "divider";

export type MiniCheckPayload = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  wrongFeedback?: Record<string, string>;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title?: string;
  text?: string;
  items?: string[];
  columns?: { header: string; values: string[] }[];
  miniCheck?: MiniCheckPayload;
  vocabularyItems?: RichVocabularyItem[];
  lines?: BilingualLine[];
  dialogue?: DialogueTurn[];
  mistakes?: CommonMistake[];
  practiceQuestions?: PracticeQuestion[];
  taskKind?: "WRITING" | "SPEAKING" | "PRONUNCIATION" | "NOTE";
  checklist?: string[];
  usefulPhrases?: BilingualLine[];
};

export type LessonSlide = {
  id: string;
  unitId: string;
  order: number;
  title: string;
  contentBlocks: ContentBlock[];
  estimatedMinutes: number;
  isRequired: boolean;
  completionRule: SlideCompletionRule;
  minimumViewSeconds?: number;
  previousSlideId?: string;
  nextSlideId?: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
};

export type LearningPosition = {
  userId: string;
  courseId: string;
  unitId: string;
  stage: UnitStage;
  itemId?: string;
  quizAttemptId?: string;
  updatedAt: string;
  lastCompletedItemId?: string;
};

export type StudySession = {
  id: string;
  userId: string;
  courseId: string;
  unitId: string;
  startedAt: string;
  endedAt?: string;
  activeSeconds: number;
  sessionType: "LESSON" | "EXERCISE" | "QUIZ";
  deviceType: "DESKTOP" | "TABLET" | "MOBILE" | "UNKNOWN";
};
