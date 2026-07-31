import type { LearningState } from "@/types/progress";

export type ServerLearningPayload = {
  state: LearningState | null;
  updatedAt?: string;
};

export function normalizeLearningStateForUser(state: LearningState, userId: string): LearningState {
  return {
    ...state,
    userId,
    enrollments: state.enrollments.map((item) => ({ ...item, userId })),
    unitProgress: Object.fromEntries(Object.entries(state.unitProgress).map(([key, item]) => [key, { ...item, userId }])),
    slideProgress: Object.fromEntries(Object.entries(state.slideProgress).map(([key, item]) => [key, { ...item, userId }])),
    exerciseAttempts: state.exerciseAttempts.map((item) => ({ ...item, userId })),
    quizAttempts: state.quizAttempts.map((item) => ({ ...item, userId })),
    learningPositions: Object.fromEntries(Object.entries(state.learningPositions).map(([key, item]) => [key, { ...item, userId }])),
    activities: state.activities.map((item) => ({ ...item, userId })),
    studySessions: state.studySessions.map((item) => ({ ...item, userId })),
  };
}

export function hasMeaningfulProgress(state: LearningState) {
  return Object.keys(state.slideProgress).length > 0 || state.exerciseAttempts.length > 0 || state.quizAttempts.length > 0 || Object.keys(state.unitProgress).length > 0;
}
