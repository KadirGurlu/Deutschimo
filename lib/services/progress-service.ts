"use client";

import { exercises, quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { calculateCourseProgress, calculateUnitProgress } from "@/lib/learning/progress-calculator";
import { readLearningState, saveExerciseAttempt, saveQuizAttempt, saveSlideProgress, updateLearningPosition } from "@/lib/storage/learning-storage";

export function getUserUnitProgress(unitId: string) {
  const unit = units.find((item) => item.id === unitId);
  const quiz = quizzes.find((item) => item.unitId === unitId);
  if (!unit || !quiz) return undefined;
  const state = readLearningState();
  return calculateUnitProgress(state, unit, slides.filter((item) => item.unitId === unitId), exercises.filter((item) => item.unitId === unitId), quiz);
}

export function getUserCourseProgress(courseId: string) {
  const state = readLearningState();
  const courseUnits = units.filter((unit) => unit.courseId === courseId);
  const progress = courseUnits.map((unit) => {
    const quiz = quizzes.find((item) => item.unitId === unit.id)!;
    return calculateUnitProgress(state, unit, slides.filter((item) => item.unitId === unit.id), exercises.filter((item) => item.unitId === unit.id), quiz);
  });
  return { percent: calculateCourseProgress(progress), units: progress };
}

export { saveSlideProgress, saveExerciseAttempt, saveQuizAttempt, updateLearningPosition };

export function completeUnit(unitId: string) {
  return getUserUnitProgress(unitId);
}

export function unlockNextUnit(courseId: string) {
  return getUserCourseProgress(courseId);
}
