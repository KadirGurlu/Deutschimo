export type CourseLevel = "A1" | "A2" | "B1" | "B2";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type UnitStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CompletionRules = {
  requireAllSlides: boolean;
  requireAllExercises: boolean;
  requireUnitQuiz: boolean;
  minimumQuizScore: number;
  requireWritingAssignment: boolean;
  requireTeacherApproval: boolean;
};

export type ProgressWeights = {
  lessons: number;
  exercises: number;
  quiz: number;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  status: CourseStatus;
  estimatedHours: number;
  unitCount: number;
  completionRules: CompletionRules;
  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  courseId: string;
  order: number;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: UnitStatus;
  prerequisiteUnitId?: string;
  progressWeights: ProgressWeights;
  completionRules: CompletionRules;
  createdAt: string;
  updatedAt: string;
};
