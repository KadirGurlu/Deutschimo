import { emptyLearningState } from "@/data/progress";
import type {
  ActivityEvent,
  Enrollment,
  ExerciseAttempt,
  LearningState,
  QuizAttempt,
  SlideProgress,
  UnitProgress,
} from "@/types/progress";
export type ServerLearningPayload = {
  state: LearningState | null;
  updatedAt?: string;
};

import type { LearningPosition, StudySession } from "@/types/learning";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const record = asRecord(value);
  return record ? (Object.values(record) as T[]) : [];
}

function asKeyedRecord<T>(
  value: unknown,
  keyOf: (item: T) => string | undefined,
): Record<string, T> {
  const record = asRecord(value);
  if (record) return record as Record<string, T>;

  if (!Array.isArray(value)) return {};

  const entries: Array<[string, T]> = [];
  for (const item of value as T[]) {
    const key = keyOf(item);
    if (key) entries.push([key, item]);
  }
  return Object.fromEntries(entries);
}

/**
 * Converts historical/partial LearningState payloads into the current canonical
 * shape. Older snapshots may contain arrays serialized as keyed objects or may
 * omit fields that were introduced in later releases.
 */
export function normalizeLearningStateForUser(
  state: LearningState | unknown,
  userId: string,
): LearningState {
  const source = asRecord(state) ?? {};

  const enrollments = asArray<Enrollment>(source.enrollments);
  const unitProgress = asKeyedRecord<UnitProgress>(
    source.unitProgress,
    (item) => item?.unitId ?? item?.id,
  );
  const slideProgress = asKeyedRecord<SlideProgress>(
    source.slideProgress,
    (item) => item?.slideId ?? item?.id,
  );
  const exerciseAttempts = asArray<ExerciseAttempt>(source.exerciseAttempts);
  const quizAttempts = asArray<QuizAttempt>(source.quizAttempts);
  const learningPositions = asKeyedRecord<LearningPosition>(
    source.learningPositions,
    (item) => item?.courseId,
  );
  const activities = asArray<ActivityEvent>(source.activities);
  const studySessions = asArray<StudySession>(source.studySessions);

  return {
    ...structuredClone(emptyLearningState),
    ...source,
    userId,
    enrollments: enrollments.map((item) => ({ ...item, userId })),
    unitProgress: Object.fromEntries(
      Object.entries(unitProgress).map(([key, item]) => [
        key,
        { ...item, userId },
      ]),
    ),
    slideProgress: Object.fromEntries(
      Object.entries(slideProgress).map(([key, item]) => [
        key,
        { ...item, userId },
      ]),
    ),
    exerciseAttempts: exerciseAttempts.map((item) => ({ ...item, userId })),
    quizAttempts: quizAttempts.map((item) => ({ ...item, userId })),
    learningPositions: Object.fromEntries(
      Object.entries(learningPositions).map(([key, item]) => [
        key,
        { ...item, userId },
      ]),
    ),
    activities: activities.map((item) => ({ ...item, userId })),
    studySessions: studySessions.map((item) => ({ ...item, userId })),
  } as LearningState;
}

export function hasMeaningfulProgress(state: LearningState) {
  return (
    Object.keys(state.slideProgress).length > 0 ||
    state.exerciseAttempts.length > 0 ||
    state.quizAttempts.length > 0 ||
    Object.keys(state.unitProgress).length > 0
  );
}
