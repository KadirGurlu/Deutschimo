export type LearningStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LOCKED";
export type UnitStage = "LESSONS" | "EXERCISES" | "QUIZ" | "REVIEW" | "COMPLETED";
export type SlideCompletionRule = "NEXT_CLICK" | "MINI_CHECK" | "MIN_TIME" | "MANUAL";
export type ContentBlockType =
  | "text"
  | "heading"
  | "example"
  | "translation"
  | "grammar_table"
  | "vocabulary_list"
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
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title?: string;
  text?: string;
  items?: string[];
  columns?: { header: string; values: string[] }[];
  miniCheck?: MiniCheckPayload;
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
