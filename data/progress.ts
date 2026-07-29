import type { LearningState } from "@/types/progress";

export const emptyLearningState: LearningState = {
  userId: "usr-kadir",
  enrollments: [],
  unitProgress: {},
  slideProgress: {},
  exerciseAttempts: [],
  quizAttempts: [],
  learningPositions: {},
  activities: [],
  studySessions: [],
};
