"use client";

import { useCallback, useEffect, useState } from "react";
import { exercises, quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { LEARNING_EVENT, readContentState, writeContentState, type ContentState, type UnitContentOverride } from "@/lib/storage/learning-storage";
import type { Exercise, UnitQuiz } from "@/types/exercise";
import type { LessonSlide } from "@/types/learning";
import type { Unit } from "@/types/course";

const baseSlidesByUnit = new Map<string, LessonSlide[]>();
for (const slide of slides) {
  const current=baseSlidesByUnit.get(slide.unitId)??[]; current.push(slide); baseSlidesByUnit.set(slide.unitId,current);
}
const baseExercisesByUnit = new Map<string, Exercise[]>();
for (const exercise of exercises) {
  const current=baseExercisesByUnit.get(exercise.unitId)??[]; current.push(exercise); baseExercisesByUnit.set(exercise.unitId,current);
}

type RemoteUnitContent={unit:Unit;slides:LessonSlide[];exercises:Exercise[];quiz?:UnitQuiz};

export function useContentStore(activeUnitId?: string) {
  const [state,setState]=useState<ContentState>(()=>readContentState());
  const [remote,setRemote]=useState<RemoteUnitContent|null>(null);

  const reload=useCallback(()=>setState(readContentState()),[]);
  useEffect(()=>{reload();window.addEventListener(LEARNING_EVENT,reload);return()=>window.removeEventListener(LEARNING_EVENT,reload)},[reload]);

  useEffect(()=>{
    if(!activeUnitId){setRemote(null);return}
    let cancelled=false;
    fetch(`/api/content/unit/${encodeURIComponent(activeUnitId)}`,{cache:"no-store"})
      .then((response)=>response.ok?response.json():null)
      .then((payload)=>{if(!cancelled&&payload?.unit)setRemote(payload as RemoteUnitContent)})
      .catch(()=>undefined);
    return()=>{cancelled=true};
  },[activeUnitId]);

  const persist=useCallback((next:ContentState)=>{writeContentState(next);setState(next)},[]);
  const updateUnit=useCallback((unitId:string,override:UnitContentOverride)=>{
    const current=readContentState();persist({...current,units:{...current.units,[unitId]:{...(current.units[unitId]??{}),...override}}})
  },[persist]);
  const setSlides=useCallback((unitId:string,nextSlides:LessonSlide[])=>{
    const current=readContentState();persist({...current,slides:{...current.slides,[unitId]:nextSlides}})
  },[persist]);
  const setExercises=useCallback((unitId:string,nextExercises:Exercise[])=>{
    const current=readContentState();persist({...current,exercises:{...current.exercises,[unitId]:nextExercises}})
  },[persist]);
  const resetUnit=useCallback((unitId:string)=>{
    const current=readContentState();const next={...current,units:{...current.units},slides:{...current.slides},exercises:{...current.exercises},quizzes:{...current.quizzes}};
    delete next.units[unitId];delete next.slides[unitId];delete next.exercises[unitId];delete next.quizzes[unitId];persist(next)
  },[persist]);

  const getUnit=useCallback((unitId:string)=>{
    if(remote?.unit.id===unitId)return remote.unit;
    const base=units.find((unit)=>unit.id===unitId);return base?{...base,...(state.units[unitId]??{})}:undefined
  },[remote,state.units]);
  const getSlides=useCallback((unitId:string)=>remote?.unit.id===unitId?remote.slides:(state.slides[unitId]??baseSlidesByUnit.get(unitId)??[]),[remote,state.slides]);
  const getExercises=useCallback((unitId:string)=>remote?.unit.id===unitId?remote.exercises:(state.exercises[unitId]??baseExercisesByUnit.get(unitId)??[]),[remote,state.exercises]);
  const getQuiz=useCallback((unitId:string)=>remote?.unit.id===unitId?(remote.quiz??quizzes.find((q)=>q.unitId===unitId)):(state.quizzes[unitId]??quizzes.find((q)=>q.unitId===unitId)),[remote,state.quizzes]);

  return {state,updateUnit,setSlides,setExercises,resetUnit,getUnit,getSlides,getExercises,getQuiz,remoteReady:!activeUnitId||Boolean(remote)};
}
