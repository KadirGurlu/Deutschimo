"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, LogOut } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ExerciseRenderer } from "@/components/exercises/exercise-renderer";
import { ExerciseFeedback } from "@/components/exercises/exercise-feedback";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { useContentStore } from "@/hooks/use-content-store";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { recordAssessmentEvidence } from "@/lib/assessment/client";
import { saveExerciseAttempt, startUnit } from "@/lib/storage/learning-storage";
import type { Course, Unit } from "@/types/course";

const typeLabels = {
  MULTIPLE_CHOICE: "Çoktan seçmeli",
  MULTIPLE_SELECT: "Çoklu seçim",
  TRUE_FALSE: "Doğru / Yanlış",
  FILL_IN_THE_BLANK: "Boşluk doldurma",
  MATCHING: "Eşleştirme",
  SENTENCE_ORDERING: "Cümle sıralama",
  TRANSLATION: "Çeviri",
  DIALOGUE_COMPLETION: "Diyalog tamamlama",
  SHORT_ANSWER: "Kısa cevap",
  WRITING_ASSIGNMENT: "Yazma görevi",
} as const;

export function ExerciseShell({ course, unit }: { course: Course; unit: Unit }) {
  const progress = useLearningProgress(course);
  const content = useContentStore();
  const managedUnit = content.getUnit(unit.id) ?? unit;
  const slides = content.getSlides(unit.id);
  const exercises = content.getExercises(unit.id);
  const quiz = content.getQuiz(unit.id)!;
  const unitProgress = progress.unitProgressMap[unit.id];
  const unfinishedIndex = exercises.findIndex((exercise) => !progress.state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id));
  const firstUnfinished = unfinishedIndex === -1 ? Math.max(0, exercises.length - 1) : unfinishedIndex;
  const [index, setIndex] = useState(firstUnfinished);
  const [answer, setAnswer] = useState<unknown>("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startedAt = useRef(Date.now());
  const exercise = exercises[index];

  const exerciseId = exercise?.id;
  const firstSlideId = slides[0]?.id;

  useEffect(() => {
    if (exerciseId) startUnit(course.id, unit.id, firstSlideId);
    setAnswer("");
    setChecked(false);
    setCorrect(false);
    setAttempts(0);
    startedAt.current = Date.now();
  }, [course.id, exerciseId, firstSlideId, unit.id]);

  const lessonsComplete = unitProgress?.lessonProgress === 100;
  const alreadySubmitted = exercise ? progress.state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id) : false;
  const isAnswerValid = useMemo(() => {
    if (typeof answer === "boolean") return true;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === "object" && answer !== null) return Object.keys(answer).length > 0;
    return String(answer ?? "").trim().length > 0;
  }, [answer]);

  if (managedUnit.status !== "PUBLISHED") return <section className="empty-state"><h1>İçerik yayında değil</h1><p>Admin panelinden yayınlandıktan sonra erişilebilir.</p></section>;
  if (!lessonsComplete) return <section className="locked-content-state"><Bookmark size={38}/><h1>Alıştırmalar henüz kilitli</h1><p>Alıştırmalara geçmek için bu ünitenin zorunlu ders notlarını tamamla.</p><Link className="button button-primary" href={`/learn/${course.id}/${unit.id}`}>Ders Notlarına Dön</Link></section>;
  if (!exercise) return <section className="empty-state"><h1>Alıştırma bulunamadı</h1><p>Admin panelinden alıştırma eklenebilir.</p></section>;

  const check = () => {
    const teacherEvaluated = exercise.type === "SHORT_ANSWER" || exercise.type === "WRITING_ASSIGNMENT";
    const preparedAnswer = exercise.type === "MATCHING" && typeof answer === "object" && answer !== null ? Object.entries(answer as Record<string, string>).map(([left, right]) => `${left}:${right}`) : exercise.type === "SENTENCE_ORDERING" && Array.isArray(answer) ? answer.join(" ") : answer;
    const isCorrect = teacherEvaluated || answersMatch(preparedAnswer, exercise.correctAnswer, exercise.acceptedAnswers);
    const attemptNumber = attempts + 1;
    setAttempts((current) => current + 1);
    setCorrect(isCorrect);
    setChecked(true);
    if (exercise.assessment?.objectiveCodes.length) {
      void recordAssessmentEvidence({
        sourceType: "EXERCISE",
        sourceId: exercise.id,
        courseId: course.id,
        unitId: unit.id,
        level: course.level,
        objectiveCodes: exercise.assessment.objectiveCodes,
        topicTags: exercise.assessment.topicTags,
        skill: exercise.assessment.skill,
        difficulty: exercise.assessment.difficulty,
        cognitiveLevel: exercise.assessment.cognitiveLevel,
        correct: isCorrect,
        answer: preparedAnswer,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        relatedSlideId: exercise.relatedSlideId,
        responseMs: Date.now() - startedAt.current,
        attemptNumber,
        pointsPossible: exercise.points,
        pointsEarned: isCorrect ? exercise.points : 0,
      });
    }
    if (isCorrect || attemptNumber >= exercise.maxAttempts) saveExerciseAttempt(course.id, unit, slides, exercises, quiz, exercise, preparedAnswer);
  };

  const next = () => {
    const isLast = index === exercises.length - 1;
    if (isLast) return;
    setIndex(index + 1);
  };

  const accepted = correct || attempts >= exercise.maxAttempts || alreadySubmitted;
  const completedCount = exercises.filter((item) => progress.state.exerciseAttempts.some((attempt) => attempt.exerciseId === item.id)).length;
  const percent = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0;

  return <main className="exercise-page-shell">
    <header className="exercise-page-head"><div><span className="eyebrow">{course.level} · ÜNİTE {unit.order}</span><h1>{unit.title}</h1><p>Alıştırmalar</p></div><Link href={`/courses/${course.slug}`} className="button button-secondary"><LogOut size={17}/> Çık ve daha sonra devam et</Link></header>
    <div className="exercise-progress-row"><span>{index + 1} / {exercises.length}</span><Progress value={Math.min(100, percent)} label={`%${Math.min(100, percent)}`}/></div>
    <article className="exercise-step-card">
      <div className="exercise-step-label"><span>{typeLabels[exercise.type]}</span><small>{exercise.points} puan · En fazla {exercise.maxAttempts} deneme</small></div>
      <h2>{exercise.title}</h2><p className="exercise-prompt">{exercise.prompt}</p>
      {exercise.assessment ? <div className="assessment-tag-row"><span>{exercise.assessment.skill}</span><span>Zorluk {exercise.assessment.difficulty}/5</span><span>{exercise.assessment.cognitiveLevel}</span></div> : null}
      <ExerciseRenderer key={exercise.id} exercise={exercise} value={answer} onChange={(value) => { setAnswer(value); setChecked(false); setCorrect(false); }} disabled={accepted}/>
      {checked ? <ExerciseFeedback correct={correct || alreadySubmitted} explanation={exercise.explanation} correctAnswer={exercise.correctAnswer} relatedSlideHref={`/learn/${course.id}/${unit.id}`} canRetry={!accepted}/> : null}
      <div className="exercise-step-actions"><Link href={`/learn/${course.id}/${unit.id}`}><ArrowLeft size={17}/> Ders Notlarına Dön</Link><div>{!accepted ? <button className="button button-primary" disabled={!isAnswerValid} onClick={check}>Kontrol Et</button> : index === exercises.length - 1 ? <Link className="button button-primary" href={`/learn/${course.id}/${unit.id}/quiz`}>Ünite Testine Geç <ArrowRight size={18}/></Link> : <button className="button button-primary" onClick={next}>Sonraki Alıştırma <ArrowRight size={18}/></button>}</div></div>
    </article>
    <aside className="exercise-sidebar"><h3>Alıştırma listesi</h3>{exercises.map((item, itemIndex) => { const done = progress.state.exerciseAttempts.some((attempt) => attempt.exerciseId === item.id); return <button key={item.id} className={itemIndex === index ? "active" : ""} disabled={!done && itemIndex > index} onClick={() => setIndex(itemIndex)}><span>{done ? <CheckCircle2 size={16}/> : itemIndex + 1}</span>{item.title}</button>; })}</aside>
  </main>;
}
