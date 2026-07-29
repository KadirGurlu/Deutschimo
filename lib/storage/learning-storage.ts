import { emptyLearningState } from "@/data/progress";
import type { Exercise, UnitQuiz } from "@/types/exercise";
import type { LearningPosition, LessonSlide } from "@/types/learning";
import type { ActivityEvent, ExerciseAttempt, LearningState, QuizAttempt, SlideProgress, UnitProgress } from "@/types/progress";
import type { Unit } from "@/types/course";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { calculateUnitProgress } from "@/lib/learning/progress-calculator";

export const LEARNING_KEY = "deutschimo-learning-v3";
export const CONTENT_KEY = "deutschimo-content-v4";
export const LEARNING_EVENT = "deutschimo-learning-updated";

export type UnitContentOverride = Partial<Pick<Unit, "title" | "description" | "estimatedMinutes" | "status" | "progressWeights" | "completionRules">>;
export type ContentState = {
  units: Record<string, UnitContentOverride>;
  slides: Record<string, LessonSlide[]>;
  exercises: Record<string, Exercise[]>;
  quizzes: Record<string, UnitQuiz>;
};

const emptyContent: ContentState = { units: {}, slides: {}, exercises: {}, quizzes: {} };

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(LEARNING_EVENT));
}

export function readLearningState(): LearningState {
  return readJson<LearningState>(LEARNING_KEY, structuredClone(emptyLearningState));
}

export function writeLearningState(state: LearningState) {
  writeJson(LEARNING_KEY, state);
}

export function resetLearningState() {
  writeLearningState(structuredClone(emptyLearningState));
}

export function readContentState(): ContentState {
  return readJson<ContentState>(CONTENT_KEY, structuredClone(emptyContent));
}

export function writeContentState(state: ContentState) {
  writeJson(CONTENT_KEY, state);
}

export function startUnit(courseId: string, unitId: string, firstSlideId?: string): LearningState {
  const state = readLearningState();
  const now = new Date().toISOString();
  const existing = state.unitProgress[unitId];
  state.unitProgress[unitId] = {
    id: existing?.id ?? `up-${unitId}`,
    userId: state.userId,
    unitId,
    status: existing?.status ?? "IN_PROGRESS",
    stage: existing?.stage ?? "LESSONS",
    lessonProgress: existing?.lessonProgress ?? 0,
    exerciseProgress: existing?.exerciseProgress ?? 0,
    quizProgress: existing?.quizProgress ?? 0,
    totalProgress: existing?.totalProgress ?? 0,
    completedSlideIds: existing?.completedSlideIds ?? [],
    completedExerciseIds: existing?.completedExerciseIds ?? [],
    startedAt: existing?.startedAt ?? now,
    completedAt: existing?.completedAt,
    lastVisitedAt: now,
    bestQuizScore: existing?.bestQuizScore,
  };
  state.learningPositions[courseId] = { userId: state.userId, courseId, unitId, stage: existing?.stage ?? "LESSONS", itemId: firstSlideId, updatedAt: now };
  if (!state.activities.some((activity) => activity.eventType === "UNIT_STARTED" && activity.unitId === unitId)) {
    state.activities.unshift(createActivity(state.userId, "UNIT_STARTED", courseId, unitId));
  }
  writeLearningState(state);
  return state;
}

export function saveSlideProgress(courseId: string, unit: Unit, allSlides: LessonSlide[], exercises: Exercise[], quiz: UnitQuiz, slideId: string, seconds = 0): LearningState {
  const state = readLearningState();
  const now = new Date().toISOString();
  const previous = state.slideProgress[slideId];
  const slideProgress: SlideProgress = {
    id: previous?.id ?? `sp-${slideId}`,
    userId: state.userId,
    slideId,
    status: "COMPLETED",
    startedAt: previous?.startedAt ?? now,
    completedAt: previous?.completedAt ?? now,
    timeSpentSeconds: Math.max(previous?.timeSpentSeconds ?? 0, seconds),
  };
  state.slideProgress[slideId] = slideProgress;
  state.activities.unshift(createActivity(state.userId, "SLIDE_COMPLETED", courseId, unit.id, slideId));
  state.unitProgress[unit.id] = calculateUnitProgress(state, unit, allSlides, exercises, quiz);
  const allDone = state.unitProgress[unit.id].lessonProgress === 100;
  if (allDone && !state.activities.some((event) => event.eventType === "LESSONS_COMPLETED" && event.unitId === unit.id)) {
    state.activities.unshift(createActivity(state.userId, "LESSONS_COMPLETED", courseId, unit.id));
  }
  state.learningPositions[courseId] = { userId: state.userId, courseId, unitId: unit.id, stage: allDone ? "EXERCISES" : "LESSONS", itemId: slideId, lastCompletedItemId: slideId, updatedAt: now };
  writeLearningState(state);
  return state;
}

export function saveExerciseAttempt(courseId: string, unit: Unit, slides: LessonSlide[], allExercises: Exercise[], quiz: UnitQuiz, exercise: Exercise, answer: unknown): LearningState {
  const state = readLearningState();
  const now = new Date().toISOString();
  const previousAttempts = state.exerciseAttempts.filter((attempt) => attempt.exerciseId === exercise.id).length;
  const teacherEvaluated = exercise.type === "SHORT_ANSWER" || exercise.type === "WRITING_ASSIGNMENT";
  const isCorrect = teacherEvaluated ? true : answersMatch(answer, exercise.correctAnswer, exercise.acceptedAnswers);
  const attempt: ExerciseAttempt = {
    id: `ea-${exercise.id}-${Date.now()}`,
    userId: state.userId,
    exerciseId: exercise.id,
    answer,
    isCorrect,
    attemptNumber: previousAttempts + 1,
    earnedPoints: isCorrect ? exercise.points : 0,
    startedAt: now,
    submittedAt: now,
  };
  state.exerciseAttempts.push(attempt);
  state.activities.unshift(createActivity(state.userId, "EXERCISE_COMPLETED", courseId, unit.id, exercise.id, { isCorrect }));
  state.unitProgress[unit.id] = calculateUnitProgress(state, unit, slides, allExercises, quiz);
  if (state.unitProgress[unit.id].exerciseProgress === 100 && !state.activities.some((event) => event.eventType === "EXERCISES_COMPLETED" && event.unitId === unit.id)) {
    state.activities.unshift(createActivity(state.userId, "EXERCISES_COMPLETED", courseId, unit.id));
  }
  state.learningPositions[courseId] = { userId: state.userId, courseId, unitId: unit.id, stage: state.unitProgress[unit.id].exerciseProgress === 100 ? "QUIZ" : "EXERCISES", itemId: exercise.id, lastCompletedItemId: exercise.id, updatedAt: now };
  writeLearningState(state);
  return state;
}

export function saveQuizAttempt(courseId: string, unit: Unit, slides: LessonSlide[], exercises: Exercise[], quiz: UnitQuiz, answers: Record<string, unknown>, score: number): LearningState {
  const state = readLearningState();
  const now = new Date().toISOString();
  const passed = score >= quiz.minimumScore;
  const attempt: QuizAttempt = { id: `qa-${quiz.id}-${Date.now()}`, userId: state.userId, quizId: quiz.id, answers, score, passed, startedAt: now, submittedAt: now };
  state.quizAttempts.push(attempt);
  state.activities.unshift(createActivity(state.userId, "QUIZ_COMPLETED", courseId, unit.id, quiz.id, { score }));
  if (passed) state.activities.unshift(createActivity(state.userId, "QUIZ_PASSED", courseId, unit.id, quiz.id, { score }));
  state.unitProgress[unit.id] = calculateUnitProgress(state, unit, slides, exercises, quiz);
  if (state.unitProgress[unit.id].status === "COMPLETED" && !state.activities.some((event) => event.eventType === "UNIT_COMPLETED" && event.unitId === unit.id)) {
    state.activities.unshift(createActivity(state.userId, "UNIT_COMPLETED", courseId, unit.id, quiz.id, { score }));
  }
  state.learningPositions[courseId] = { userId: state.userId, courseId, unitId: unit.id, stage: passed ? "COMPLETED" : "QUIZ", itemId: quiz.id, quizAttemptId: attempt.id, lastCompletedItemId: passed ? quiz.id : undefined, updatedAt: now };
  writeLearningState(state);
  return state;
}

export function updateLearningPosition(position: LearningPosition): LearningState {
  const state = readLearningState();
  state.learningPositions[position.courseId] = position;
  if (state.unitProgress[position.unitId]) state.unitProgress[position.unitId].lastVisitedAt = position.updatedAt;
  writeLearningState(state);
  return state;
}

function createActivity(userId: string, eventType: ActivityEvent["eventType"], courseId: string, unitId?: string, itemId?: string, metadata?: ActivityEvent["metadata"]): ActivityEvent {
  return { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, userId, eventType, courseId, unitId, itemId, metadata, createdAt: new Date().toISOString() };
}
