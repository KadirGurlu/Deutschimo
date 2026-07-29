"use client";

import { useCallback, useEffect, useState } from "react";
import { exercises } from "@/data/exercises";
import { quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { LEARNING_EVENT, readContentState, writeContentState, type ContentState, type UnitContentOverride } from "@/lib/storage/learning-storage";
import type { Exercise } from "@/types/exercise";
import type { LessonSlide } from "@/types/learning";

export function useContentStore() {
  const [state, setState] = useState<ContentState>(() => readContentState());

  const reload = useCallback(() => setState(readContentState()), []);
  useEffect(() => {
    reload();
    window.addEventListener(LEARNING_EVENT, reload);
    return () => window.removeEventListener(LEARNING_EVENT, reload);
  }, [reload]);

  const persist = useCallback((next: ContentState) => {
    writeContentState(next);
    setState(next);
  }, []);

  const updateUnit = useCallback((unitId: string, override: UnitContentOverride) => {
    const current = readContentState();
    persist({ ...current, units: { ...current.units, [unitId]: { ...(current.units[unitId] ?? {}), ...override } } });
  }, [persist]);

  const setSlides = useCallback((unitId: string, nextSlides: LessonSlide[]) => {
    const current = readContentState();
    persist({ ...current, slides: { ...current.slides, [unitId]: nextSlides } });
  }, [persist]);

  const setExercises = useCallback((unitId: string, nextExercises: Exercise[]) => {
    const current = readContentState();
    persist({ ...current, exercises: { ...current.exercises, [unitId]: nextExercises } });
  }, [persist]);

  const resetUnit = useCallback((unitId: string) => {
    const current = readContentState();
    const next = { ...current, units: { ...current.units }, slides: { ...current.slides }, exercises: { ...current.exercises }, quizzes: { ...current.quizzes } };
    delete next.units[unitId];
    delete next.slides[unitId];
    delete next.exercises[unitId];
    delete next.quizzes[unitId];
    persist(next);
  }, [persist]);

  const getUnit = useCallback((unitId: string) => {
    const base = units.find((unit) => unit.id === unitId);
    return base ? { ...base, ...(state.units[unitId] ?? {}) } : undefined;
  }, [state.units]);

  const getSlides = useCallback((unitId: string) => state.slides[unitId] ?? slides.filter((slide) => slide.unitId === unitId), [state.slides]);
  const getExercises = useCallback((unitId: string) => state.exercises[unitId] ?? exercises.filter((exercise) => exercise.unitId === unitId), [state.exercises]);
  const getQuiz = useCallback((unitId: string) => state.quizzes[unitId] ?? quizzes.find((quiz) => quiz.unitId === unitId), [state.quizzes]);

  return { state, updateUnit, setSlides, setExercises, resetUnit, getUnit, getSlides, getExercises, getQuiz };
}
