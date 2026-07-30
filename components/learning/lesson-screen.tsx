"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, List, NotebookPen } from "lucide-react";
import { UnitSidebar } from "@/components/learning/unit-sidebar";
import { LessonSlide } from "@/components/learning/lesson-slide";
import { SlideProgress } from "@/components/learning/slide-progress";
import { SlideNavigation } from "@/components/learning/slide-navigation";
import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { LockedContentState } from "@/components/feedback/locked-content-state";
import { LearningSkeleton } from "@/components/feedback/learning-skeleton";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { useContentStore } from "@/hooks/use-content-store";
import { exercises as baseExercises, quizzes } from "@/data/exercises";
import { slides as baseSlides } from "@/data/slides";
import { saveSlideProgress, startUnit, updateLearningPosition } from "@/lib/storage/learning-storage";
import { lockReason } from "@/lib/learning/unlock-rules";
import type { Course, Unit } from "@/types/course";

export function LessonScreen({ course, unit }: { course: Course; unit: Unit }) {
  const router = useRouter();
  const progress = useLearningProgress(course);
  const content = useContentStore();
  const managedUnit = content.getUnit(unit.id) ?? unit;
  const unitSlides = content.getSlides(unit.id).filter((slide) => slide.status === "PUBLISHED");
  const unitExercises = content.getExercises(unit.id);
  const quiz = content.getQuiz(unit.id) ?? quizzes.find((item) => item.unitId === unit.id)!;
  const position = progress.state.learningPositions[course.id];
  const initialIndex = Math.max(0, position?.unitId === unit.id && position.itemId ? unitSlides.findIndex((slide) => slide.id === position.itemId) : unitSlides.findIndex((slide) => progress.state.slideProgress[slide.id]?.status !== "COMPLETED"));
  const [index, setIndex] = useState(initialIndex < 0 ? 0 : initialIndex);
  const [miniAnswers, setMiniAnswers] = useState<Record<string, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<string, Record<string, boolean>>>({});
  const [elapsed, setElapsed] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "offline">("saved");
  const [notes, setNotes] = useState("");
  const startedAt = useRef(Date.now());
  const slide = unitSlides[index];
  const unitProgress = progress.unitProgressMap[unit.id];
  const status = progress.getStatus(unit.id);

  useEffect(() => {
    if (!slide || status === "LOCKED") return;
    startUnit(course.id, unit.id, slide.id);
    startedAt.current = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    const savedNote = window.localStorage.getItem(`deutschimo-note-${unit.id}`);
    if (savedNote) setNotes(savedNote);
    return () => window.clearInterval(timer);
  }, [course.id, slide?.id, status, unit.id]);

  const completed = Boolean(slide && progress.state.slideProgress[slide.id]?.status === "COMPLETED");
  const miniCheck = slide?.contentBlocks.find((block) => block.type === "mini_check")?.miniCheck;
  const miniAnswered = !miniCheck || Boolean(miniAnswers[slide.id]);
  const miniCorrect = !miniCheck || miniAnswers[slide.id] === miniCheck.correctAnswer || completed;
  const minTimePassed = !slide?.minimumViewSeconds || elapsed >= slide.minimumViewSeconds || completed;
  const practiceQuestions = slide?.contentBlocks.flatMap((item) => item.type === "practice_set" ? (item.practiceQuestions ?? []) : []) ?? [];
  const practiceComplete = completed || practiceQuestions.length === 0 || practiceQuestions.every((question) => practiceResults[slide.id]?.[question.id]);
  const canNext = Boolean(slide && miniCorrect && minTimePassed && practiceComplete);
  const allOtherRequiredDone = useMemo(() => unitSlides.filter((item) => item.isRequired && item.id !== slide?.id).every((item) => progress.state.slideProgress[item.id]?.status === "COMPLETED"), [progress.state.slideProgress, slide?.id, unitSlides]);
  const isLast = index === unitSlides.length - 1;

  if (managedUnit.status !== "PUBLISHED") return <section className="empty-state"><h1>İçerik yayında değil</h1><p>Bu ünite taslak veya arşiv durumunda olduğu için öğrenci görünümünde gösterilmiyor.</p></section>;
  if (!progress.ready) return <LearningSkeleton/>;
  if (status === "LOCKED") return <LockedContentState courseId={course.id} reason={lockReason(unit, progress.units) ?? "Bu ünite kilitli."}/>;
  if (!slide) return <section className="empty-state"><h1>Ders içeriği bulunamadı</h1><p>İçerik admin panelinden eklenebilir.</p></section>;

  const completeAndMove = () => {
    setSaveStatus(navigator.onLine ? "saving" : "offline");
    saveSlideProgress(course.id, unit, unitSlides, unitExercises.length ? unitExercises : baseExercises.filter((exercise) => exercise.unitId === unit.id), quiz, slide.id, elapsed);
    window.setTimeout(() => setSaveStatus(navigator.onLine ? "saved" : "offline"), 250);
    if (isLast) {
      router.push(`/learn/${course.id}/${unit.id}/exercises`);
      return;
    }
    const nextIndex = index + 1;
    const next = unitSlides[nextIndex];
    updateLearningPosition({ userId: progress.state.userId, courseId: course.id, unitId: unit.id, stage: "LESSONS", itemId: next.id, lastCompletedItemId: slide.id, updatedAt: new Date().toISOString() });
    setIndex(nextIndex);
  };

  const selectSlide = (nextIndex: number) => {
    const target = unitSlides[nextIndex];
    const viewed = progress.state.slideProgress[target.id]?.status === "COMPLETED" || nextIndex <= index + 1;
    if (viewed) setIndex(nextIndex);
  };

  return <div className="new-learning-shell">
    <UnitSidebar course={course} units={progress.units} currentUnitId={unit.id} coursePercent={progress.coursePercent} getStatus={progress.getStatus}/>
    <main className="slide-workspace">
      <div className="slide-topbar"><div><span className="eyebrow">{course.level} · ÜNİTE {unit.order}</span><strong>{unit.title}</strong></div><SaveStatusIndicator status={saveStatus}/></div>
      <SlideProgress current={Math.min(unitSlides.length, (unitProgress?.completedSlideIds.length ?? 0) + (completed ? 0 : 1))} total={unitSlides.length}/>
      <LessonSlide slide={slide} miniAnswer={miniAnswers[slide.id]} onMiniAnswer={(value) => setMiniAnswers((current) => ({ ...current, [slide.id]: value }))} onPracticeResult={(questionId, correct) => setPracticeResults((current) => ({ ...current, [slide.id]: { ...(current[slide.id] ?? {}), [questionId]: correct } }))}/>
      <SlideNavigation canPrevious={index > 0} canNext={canNext && (!isLast || allOtherRequiredDone)} isLast={isLast} onPrevious={() => selectSlide(index - 1)} onNext={completeAndMove} nextHint={!miniAnswered ? "Devam etmek için mini kontrolü cevapla." : !miniCorrect ? "Sonraki slayta geçmek için doğru cevabı bul." : !minTimePassed ? "İçeriği incelemek için birkaç saniye ayır." : !practiceComplete ? "Konu sonu kontrolündeki bütün soruları doğru cevapla." : isLast && !allOtherRequiredDone ? "Alıştırmalara geçmek için zorunlu slaytları tamamla." : undefined}/>
    </main>
    <aside className="lesson-right-panel">
      <section><BookOpenText size={20}/><h3>Ünite özeti</h3><p>{unit.description}</p></section>
      <section><List size={20}/><h3>İçindekiler</h3><ol>{unitSlides.map((item, itemIndex) => <li key={item.id}><button disabled={itemIndex > index + 1 && progress.state.slideProgress[item.id]?.status !== "COMPLETED"} onClick={() => selectSlide(itemIndex)} className={itemIndex === index ? "active" : ""}>{item.order}. {item.title}</button></li>)}</ol></section>
      <section><NotebookPen size={20}/><h3>Ders notlarım</h3><textarea value={notes} onChange={(event: { target: { value: string } }) => setNotes(event.target.value)} placeholder="Notlarını yaz..."/><button className="button button-secondary" onClick={() => { window.localStorage.setItem(`deutschimo-note-${unit.id}`, notes); setSaveStatus("saved"); }}>Notu Kaydet</button></section>
    </aside>
  </div>;
}
