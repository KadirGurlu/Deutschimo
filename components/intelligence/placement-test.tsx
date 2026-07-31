"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSession } from "next-auth/react";
import type { PlacementQuestion, PlacementResult } from "@/types/intelligence";

type PublicQuestion = Omit<PlacementQuestion, "correctAnswer" | "explanation">;

type TestState = "LOADING" | "INTRO" | "RUNNING" | "SUBMITTING" | "RESULT";

export function PlacementTest() {
  const { update } = useSession();
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [latest, setLatest] = useState<PlacementResult | null>(null);
  const [state, setState] = useState<TestState>("LOADING");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/intelligence/placement")
      .then(async (response) => {
        const payload = await response.json() as { questions?: PublicQuestion[]; latest?: PlacementResult | null; error?: string };
        if (!response.ok || !payload.questions) throw new Error(payload.error ?? "Sınav yüklenemedi.");
        setQuestions(payload.questions);
        setLatest(payload.latest ?? null);
        setState("INTRO");
      })
      .catch((reason: Error) => { setError(reason.message); setState("INTRO"); });
  }, []);

  const current = questions[index];
  const selected = current ? answers[current.id] : undefined;
  const progress = questions.length ? Math.round(((index + (selected ? 1 : 0)) / questions.length) * 100) : 0;
  const levelDistribution = useMemo(() => questions.reduce<Record<string, number>>((acc, question) => ({ ...acc, [question.level]: (acc[question.level] ?? 0) + 1 }), {}), [questions]);

  function begin() {
    setAnswers({}); setIndex(0); setResult(null); setError(""); setState("RUNNING");
  }

  async function next() {
    if (!current || !selected) return;
    if (index < questions.length - 1) { setIndex((value) => value + 1); return; }
    setState("SUBMITTING");
    try {
      const response = await fetch("/api/intelligence/placement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const payload = await response.json() as { result?: PlacementResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Sınav sonucu hesaplanamadı.");
      await update({ user: { currentLevel: payload.result.recommendedLevel } });
      setResult(payload.result); setLatest(payload.result); setState("RESULT");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Beklenmeyen bir hata oluştu.");
      setState("RUNNING");
    }
  }

  if (state === "LOADING") return <section className="panel intelligence-loading"><BrainCircuit className="spin-soft"/><h2>Seviye sınavı hazırlanıyor</h2><p>Sorular ve önceki sonuçların getiriliyor.</p></section>;

  if (state === "INTRO") return <section className="intelligence-hero-card">
    <div><span className="eyebrow">V12 · SEVİYE BELİRLEME</span><h1>Almancaya doğru seviyeden başla.</h1><p>24 özgün soru; kelime, gramer, okuma ve iletişim becerilerini A1’den B2’ye kadar ölçer. Sonuçların hesabına kaydedilir ve günlük planını kişiselleştirir.</p>
      <div className="intelligence-mini-grid">{Object.entries(levelDistribution).map(([level,count])=><span key={level}><strong>{level}</strong>{count} soru</span>)}</div>
      <button className="button button-primary" onClick={begin}><Sparkles size={18}/>Sınavı Başlat</button>
      {error ? <div className="auth-message auth-error">{error}</div> : null}
    </div>
    <aside className="intelligence-summary-card"><BrainCircuit size={36}/><h3>Yaklaşık 15 dakika</h3><p>Sorular tek tek gelir. Yanıtlar sınav sonunda değerlendirilir.</p>{latest?<div className="previous-result"><small>Son sonucun</small><strong>{latest.recommendedLevel}</strong><span>%{latest.totalScore} genel başarı</span></div>:null}</aside>
  </section>;

  if (state === "RESULT" && result) return <PlacementResultView result={result} onRetry={begin}/>;

  if (!current) return <section className="panel"><h2>Soru bulunamadı</h2><p>Sayfayı yenileyip tekrar dene.</p></section>;

  return <section className="placement-shell">
    <div className="placement-top"><div><span className="level-badge">{current.level}</span><span>{current.skill === "GRAMMAR" ? "Gramer" : current.skill === "VOCABULARY" ? "Kelime" : current.skill === "READING" ? "Okuma" : "İletişim"}</span></div><strong>{index + 1} / {questions.length}</strong></div>
    <Progress value={progress} label={`Sınav ilerlemesi · %${progress}`}/>
    <article className="placement-question-card"><span className="eyebrow">{current.topic}</span><h2>{current.prompt}</h2><div className="placement-options">{current.options.map((item, optionIndex)=><button key={item.id} className={selected === item.value ? "selected" : ""} onClick={()=>setAnswers((value)=>({...value,[current.id]:item.value}))}><span>{String.fromCharCode(65+optionIndex)}</span>{item.label}</button>)}</div>
      {error ? <div className="auth-message auth-error">{error}</div> : null}
      <div className="placement-actions">{index>0?<button className="button button-secondary" onClick={()=>setIndex((value)=>value-1)}>Önceki</button>:<span/>}<button className="button button-primary" disabled={!selected || state === "SUBMITTING"} onClick={next}>{state === "SUBMITTING" ? "Sonuç hesaplanıyor..." : index === questions.length-1 ? "Sınavı Tamamla" : "Sonraki Soru"}<ArrowRight size={18}/></button></div>
    </article>
  </section>;
}

function PlacementResultView({ result, onRetry }: { result: PlacementResult; onRetry: () => void }) {
  const courseHref = `/courses/${result.recommendedLevel.toLowerCase()}`;
  return <section className="placement-result-card"><div className="placement-result-level"><CheckCircle2/><small>Önerilen başlangıç seviyesi</small><strong>{result.recommendedLevel}</strong><span>%{result.totalScore} genel başarı</span></div><div className="placement-result-content"><span className="eyebrow">KİŞİSEL SONUÇ RAPORU</span><h1>{result.correctCount}/{result.questionCount} doğru cevap</h1><div className="level-score-grid">{Object.entries(result.levelScores).map(([level,score])=><div key={level}><strong>{level}</strong><Progress value={score} label={`%${score}`}/></div>)}</div><div className="insight-columns"><div><h3>Güçlü alanların</h3>{result.strengths.length?result.strengths.map((item)=><span className="insight-chip success" key={item}>{item}</span>):<p>Güçlü alan tespiti için daha fazla doğru cevap gerekiyor.</p>}</div><div><h3>Öncelikli tekrar alanların</h3>{result.weakTopics.length?result.weakTopics.map((item)=><span className="insight-chip warning" key={item}>{item}</span>):<p>Belirgin bir zayıf alan görünmüyor.</p>}</div></div><div className="placement-result-actions"><Link className="button button-primary" href={courseHref}>Önerilen Kursu Aç<ArrowRight size={18}/></Link><Link className="button button-secondary" href="/study-plan">Günlük Planımı Gör</Link><button className="button button-ghost" onClick={onRetry}><RotateCcw size={17}/>Sınavı Yenile</button></div></div></section>;
}
