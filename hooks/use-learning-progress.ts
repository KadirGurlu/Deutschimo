"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { exercises, quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { calculateCourseProgress, calculateUnitProgress } from "@/lib/learning/progress-calculator";
import { isUnitLocked } from "@/lib/learning/unlock-rules";
import { LEARNING_EVENT, readLearningState, resetLearningState, type ContentState, readContentState } from "@/lib/storage/learning-storage";
import type { Course } from "@/types/course";
import type { LearningState, UnitProgress } from "@/types/progress";

export function useLearningProgress(course?: Course) {
  const [state, setState] = useState<LearningState>(() => readLearningState());
  const [content, setContent] = useState<ContentState>(() => readContentState());
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    setState(readLearningState());
    setContent(readContentState());
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(LEARNING_EVENT, reload);
    const onStorage = () => reload();
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LEARNING_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  const mergedUnits = useMemo(() => {
    const base = course ? units.filter((unit) => unit.courseId === course.id) : units;
    return base
      .map((unit) => ({ ...unit, ...(content.units[unit.id] ?? {}) }))
      .filter((unit) => unit.status === "PUBLISHED")
      .sort((a, b) => a.order - b.order);
  }, [content.units, course]);

  const unitProgressMap = useMemo(() => {
    const map: Record<string, UnitProgress> = {};
    for (const unit of mergedUnits) {
      const unitSlides = content.slides[unit.id] ?? slides.filter((slide) => slide.unitId === unit.id);
      const unitExercises = content.exercises[unit.id] ?? exercises.filter((exercise) => exercise.unitId === unit.id);
      const quiz = content.quizzes[unit.id] ?? quizzes.find((item) => item.unitId === unit.id);
      if (quiz) map[unit.id] = calculateUnitProgress(state, unit, unitSlides, unitExercises, quiz);
    }
    return map;
  }, [content, mergedUnits, state]);

  const coursePercent = useMemo(() => calculateCourseProgress(Object.values(unitProgressMap)), [unitProgressMap]);
  const completedCount = Object.values(unitProgressMap).filter((progress) => progress.status === "COMPLETED").length;
  const inProgressCount = Object.values(unitProgressMap).filter((progress) => progress.status === "IN_PROGRESS").length;

  const getStatus = useCallback((unitId: string): UnitProgress["status"] | "LOCKED" => {
    const unit = mergedUnits.find((item) => item.id === unitId);
    if (!unit) return "NOT_STARTED";
    if (isUnitLocked(unit, unitProgressMap)) return "LOCKED";
    return unitProgressMap[unitId]?.status ?? "NOT_STARTED";
  }, [mergedUnits, unitProgressMap]);

  const reset = useCallback(() => {
    resetLearningState();
    reload();
  }, [reload]);

  return { ready, state, content, units: mergedUnits, unitProgressMap, coursePercent, completedCount, inProgressCount, getStatus, reload, reset };
}
