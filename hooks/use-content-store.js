"use client";
import { useCallback, useEffect, useState } from "react";
import { exercises } from "@/data/exercises";
import { quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { LEARNING_EVENT, readContentState, writeContentState } from "@/lib/storage/learning-storage";
const baseSlidesByUnit = new Map();
for (const slide of slides) {
    const current = baseSlidesByUnit.get(slide.unitId) ?? [];
    current.push(slide);
    baseSlidesByUnit.set(slide.unitId, current);
}
const baseExercisesByUnit = new Map();
for (const exercise of exercises) {
    const current = baseExercisesByUnit.get(exercise.unitId) ?? [];
    current.push(exercise);
    baseExercisesByUnit.set(exercise.unitId, current);
}
export function useContentStore() {
    const [state, setState] = useState(() => readContentState());
    const reload = useCallback(() => setState(readContentState()), []);
    useEffect(() => {
        reload();
        window.addEventListener(LEARNING_EVENT, reload);
        return () => window.removeEventListener(LEARNING_EVENT, reload);
    }, [reload]);
    const persist = useCallback((next) => {
        writeContentState(next);
        setState(next);
    }, []);
    const updateUnit = useCallback((unitId, override) => {
        const current = readContentState();
        persist({ ...current, units: { ...current.units, [unitId]: { ...(current.units[unitId] ?? {}), ...override } } });
    }, [persist]);
    const setSlides = useCallback((unitId, nextSlides) => {
        const current = readContentState();
        persist({ ...current, slides: { ...current.slides, [unitId]: nextSlides } });
    }, [persist]);
    const setExercises = useCallback((unitId, nextExercises) => {
        const current = readContentState();
        persist({ ...current, exercises: { ...current.exercises, [unitId]: nextExercises } });
    }, [persist]);
    const resetUnit = useCallback((unitId) => {
        const current = readContentState();
        const next = { ...current, units: { ...current.units }, slides: { ...current.slides }, exercises: { ...current.exercises }, quizzes: { ...current.quizzes } };
        delete next.units[unitId];
        delete next.slides[unitId];
        delete next.exercises[unitId];
        delete next.quizzes[unitId];
        persist(next);
    }, [persist]);
    const getUnit = useCallback((unitId) => {
        const base = units.find((unit) => unit.id === unitId);
        return base ? { ...base, ...(state.units[unitId] ?? {}) } : undefined;
    }, [state.units]);
    const getSlides = useCallback((unitId) => state.slides[unitId] ?? baseSlidesByUnit.get(unitId) ?? [], [state.slides]);
    const getExercises = useCallback((unitId) => state.exercises[unitId] ?? baseExercisesByUnit.get(unitId) ?? [], [state.exercises]);
    const getQuiz = useCallback((unitId) => state.quizzes[unitId] ?? quizzes.find((quiz) => quiz.unitId === unitId), [state.quizzes]);
    return { state, updateUnit, setSlides, setExercises, resetUnit, getUnit, getSlides, getExercises, getQuiz };
}
