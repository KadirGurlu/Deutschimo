import type { LearningStatus, UnitStage } from "@/types/learning";

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  enrolledAt: string;
  completedAt?: string;
};

export type UnitProgress = {
  id: string;
  userId: string;
  unitId: string;
  status: LearningStatus;
  stage: UnitStage;
  lessonProgress: number;
  exerciseProgress: number;
  quizProgress: number;
  totalProgress: number;
  completedSlideIds: string[];
  completedExerciseIds: string[];
  startedAt?: string;
  completedAt?: string;
  lastVisitedAt?: string;
  bestQuizScore?: number;
};

export type SlideProgress = {
  id: string;
  userId: string;
  slideId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
};

export type ExerciseAttempt = {
  id: string;
  userId: string;
  exerciseId: string;
  answer: unknown;
  isCorrect: boolean;
  attemptNumber: number;
  earnedPoints: number;
  startedAt: string;
  submittedAt: string;
};

export type QuizAttempt = {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, unknown>;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string;
};

export type ActivityEventType =
  | "COURSE_STARTED"
  | "UNIT_STARTED"
  | "SLIDE_COMPLETED"
  | "LESSONS_COMPLETED"
  | "EXERCISE_COMPLETED"
  | "EXERCISES_COMPLETED"
  | "QUIZ_COMPLETED"
  | "QUIZ_PASSED"
  | "UNIT_COMPLETED"
  | "COURSE_COMPLETED";

export type ActivityEvent = {
  id: string;
  userId: string;
  eventType: ActivityEventType;
  courseId: string;
  unitId?: string;
  itemId?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
};

export type LearningState = {
  userId: string;
  enrollments: Enrollment[];
  unitProgress: Record<string, UnitProgress>;
  slideProgress: Record<string, SlideProgress>;
  exerciseAttempts: ExerciseAttempt[];
  quizAttempts: QuizAttempt[];
  learningPositions: Record<string, import("@/types/learning").LearningPosition>;
  activities: ActivityEvent[];
  studySessions: import("@/types/learning").StudySession[];
};
