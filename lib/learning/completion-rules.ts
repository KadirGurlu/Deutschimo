import type { Exercise, UnitQuiz } from "@/types/exercise";
import type { LessonSlide } from "@/types/learning";
import type { Unit } from "@/types/course";
import type { LearningState } from "@/types/progress";

export function requiredSlidesCompleted(state: LearningState, slides: LessonSlide[]): boolean {
  const required = slides.filter((slide) => slide.isRequired && slide.status === "PUBLISHED");
  return required.every((slide) => state.slideProgress[slide.id]?.status === "COMPLETED");
}

export function requiredExercisesCompleted(state: LearningState, exercises: Exercise[]): boolean {
  const required = exercises.filter((exercise) => exercise.isRequired);
  return required.every((exercise) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id));
}

export function quizPassed(state: LearningState, quiz: UnitQuiz): boolean {
  return state.quizAttempts.some((attempt) => attempt.quizId === quiz.id && attempt.passed);
}

export function unitCanComplete(state: LearningState, unit: Unit, slides: LessonSlide[], exercises: Exercise[], quiz: UnitQuiz): boolean {
  const rules = unit.completionRules;
  if (rules.requireAllSlides && !requiredSlidesCompleted(state, slides)) return false;
  if (rules.requireAllExercises && !requiredExercisesCompleted(state, exercises)) return false;
  if (rules.requireUnitQuiz && !quizPassed(state, quiz)) return false;
  if (rules.requireWritingAssignment) {
    const writing = exercises.filter((exercise) => exercise.type === "WRITING_ASSIGNMENT" && exercise.isRequired);
    if (!writing.every((exercise) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id))) return false;
  }
  return true;
}
