"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { QuizResult } from "@/components/exercises/quiz-result";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { useContentStore } from "@/hooks/use-content-store";
import { normalizeAnswer } from "@/lib/learning/answer-normalizer";
import { saveQuizAttempt } from "@/lib/storage/learning-storage";
import type { Course, Unit } from "@/types/course";

export function UnitQuiz({ course, unit, nextUnitId }: { course: Course; unit: Unit; nextUnitId?: string }) {
  const progress = useLearningProgress(course);
  const content = useContentStore();
  const managedUnit = content.getUnit(unit.id) ?? unit;
  const slides = content.getSlides(unit.id);
  const exercises = content.getExercises(unit.id);
  const quiz = content.getQuiz(unit.id)!;
  const draftKey = `deutschimo-quiz-draft-${quiz.id}`;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; wrong: number; blank: number; passed: boolean }>();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) setAnswers(JSON.parse(saved) as Record<string, unknown>);
    } catch { /* Bozuk taslak sessizce atlanır. */ }
  }, [draftKey]);

  useEffect(() => {
    if (!submitted) window.localStorage.setItem(draftKey, JSON.stringify(answers));
  }, [answers, draftKey, submitted]);

  const question = quiz.questions[index];
  const unanswered = quiz.questions.filter((item) => answers[item.id] === undefined || String(answers[item.id]).trim() === "").length;
  const exerciseComplete = progress.unitProgressMap[unit.id]?.exerciseProgress === 100;
  const currentAnswer = question ? answers[question.id] : undefined;

  const scoreResult = useMemo(() => {
    const correct = quiz.questions.filter((item) => normalizeAnswer(answers[item.id]) === normalizeAnswer(item.correctAnswer)).length;
    const blank = quiz.questions.filter((item) => answers[item.id] === undefined || String(answers[item.id]).trim() === "").length;
    const wrong = quiz.questions.length - correct - blank;
    const score = Math.round((correct / quiz.questions.length) * 100);
    return { correct, wrong, blank, score, passed: score >= quiz.minimumScore };
  }, [answers, quiz.minimumScore, quiz.questions]);

  if (managedUnit.status !== "PUBLISHED") return <section className="empty-state"><h1>İçerik yayında değil</h1><p>Admin panelinden yayınlandıktan sonra erişilebilir.</p></section>;
  if (!exerciseComplete) return <section className="locked-content-state"><AlertTriangle size={38}/><h1>Ünite testi henüz kilitli</h1><p>Ünite sonu değerlendirmesine geçmek için zorunlu alıştırmaları tamamla.</p><Link className="button button-primary" href={`/learn/${course.id}/${unit.id}/exercises`}>Alıştırmalara Dön</Link></section>;
  if (submitted && result) return <div className="quiz-page-wrap"><QuizResult {...result} courseId={course.id} unitId={unit.id} nextUnitId={nextUnitId} questions={quiz.questions} answers={answers} onRetry={() => { setSubmitted(false); setResult(undefined); setConfirming(false); setIndex(0); setAnswers({}); }}/></div>;
  if (!question) return <section className="empty-state"><h1>Quiz bulunamadı</h1></section>;

  const submitQuiz = () => {
    saveQuizAttempt(course.id, unit, slides, exercises, quiz, answers, scoreResult.score);
    setResult(scoreResult);
    setSubmitted(true);
    setConfirming(false);
    window.localStorage.removeItem(draftKey);
  };

  return <main className="quiz-page-wrap">
    <header className="quiz-page-header"><div><span className="eyebrow">{course.level} · ÜNİTE {unit.order}</span><h1>{quiz.title}</h1><p>Cevaplar test bitene kadar gösterilmez. Yanıtların otomatik kaydedilir.</p></div><Link className="button button-secondary" href={`/courses/${course.slug}`}>Çık ve Daha Sonra Devam Et</Link></header>
    <div className="quiz-question-progress"><span>Soru {index + 1} / {quiz.questions.length}</span><Progress value={Math.round(((index + 1) / quiz.questions.length) * 100)} label={`${unanswered} cevapsız soru`}/></div>
    <article className="quiz-question-card"><span className="level-badge">{question.topic}</span><h2>{question.prompt}</h2>
      {question.type === "MULTIPLE_CHOICE" ? <fieldset className="choice-grid"><legend className="sr-only">Cevap seç</legend><p className="selection-hint">Bir seçenek işaretle.</p>{question.options?.map((option, optionIndex) => { const selected = currentAnswer === option.value; return <button key={option.id} type="button" className={`choice-option-button ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.value }))}><span className="choice-option-marker" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span><span className="choice-option-text">{option.label}</span></button>; })}</fieldset> : question.type === "TRUE_FALSE" ? <div className="true-false-grid"><button type="button" className={currentAnswer === true ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [question.id]: true }))}>Doğru</button><button type="button" className={currentAnswer === false ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [question.id]: false }))}>Yanlış</button></div> : <label className="exercise-text-field"><span>Cevabın</span><input value={String(currentAnswer ?? "")} onChange={(event: { target: { value: string } }) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}/></label>}
      <div className="quiz-navigation"><button className="button button-secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={17}/> Önceki</button>{index < quiz.questions.length - 1 ? <button className="button button-primary" onClick={() => setIndex(index + 1)}>Sonraki <ArrowRight size={17}/></button> : <button className="button button-primary" onClick={() => setConfirming(true)}><Flag size={17}/> Testi Bitir</button>}</div>
    </article>
    <nav className="quiz-question-nav" aria-label="Quiz soruları">{quiz.questions.map((item, itemIndex) => <button key={item.id} className={`${itemIndex === index ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}</button>)}</nav>
    {confirming ? <div className="modal-backdrop"><section className="confirm-modal" role="dialog" aria-modal="true"><AlertTriangle size={28}/><h2>Testi bitirmek istediğine emin misin?</h2><p>{unanswered ? `${unanswered} soruyu boş bıraktın.` : "Bütün soruları cevapladın."} Gönderimden sonra sonuç hesaplanacaktır.</p><div><button className="button button-secondary" onClick={() => setConfirming(false)}>Teste Dön</button><button className="button button-primary" onClick={submitQuiz}>Testi Gönder</button></div></section></div> : null}
  </main>;
}
