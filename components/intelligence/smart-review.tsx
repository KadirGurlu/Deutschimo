"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, RefreshCw, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ReviewAnswerResult, ReviewItem } from "@/types/intelligence";

type ReviewPayload = { items: ReviewItem[]; completedIds: string[]; attempts: Record<string, number>; total: number; completed: number; error?: string };

export function SmartReview() {
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>("");
  const [feedback, setFeedback] = useState<ReviewAnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load(refresh = false) {
    setLoading(true); setError(""); setFeedback(null); setAnswer(""); setIndex(0);
    try {
      const response = await fetch(`/api/intelligence/review${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      const result = await response.json() as ReviewPayload;
      if (!response.ok) throw new Error(result.error ?? "Tekrar listesi getirilemedi.");
      setPayload(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Tekrar listesi getirilemedi."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); },[]);

  const pendingItems = useMemo(() => payload?.items.filter((item)=>!payload.completedIds.includes(item.id)) ?? [], [payload]);
  const current = pendingItems[index];
  const completionPercent = payload?.total ? Math.round((payload.completed / payload.total) * 100) : 0;

  async function check() {
    if (!current) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/intelligence/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: current.id, answer, completeConcept: current.type === "CONCEPT" }) });
      const result = await response.json() as { result?: ReviewAnswerResult; error?: string };
      if (!response.ok || !result.result) throw new Error(result.error ?? "Cevap kontrol edilemedi.");
      setFeedback(result.result);
      if (result.result.correct) {
        setPayload((previous)=>previous ? { ...previous, completed: result.result!.completedCount, completedIds: [...previous.completedIds, current.id] } : previous);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Cevap kontrol edilemedi."); }
    finally { setSubmitting(false); }
  }

  function next() { setFeedback(null); setAnswer(""); if (index >= pendingItems.length - 1) setIndex(0); }

  if (loading) return <section className="panel intelligence-loading"><RotateCcw className="spin-soft"/><h2>Akıllı tekrar sıran hazırlanıyor</h2><p>Yanlış yaptığın sorular ve zayıf konu analizin birleştiriliyor.</p></section>;
  if (error && !payload) return <section className="panel"><div className="auth-message auth-error">{error}</div><button className="button button-secondary" onClick={()=>load()}><RefreshCw size={17}/>Tekrar Dene</button></section>;
  if (!payload || payload.total === 0) return <section className="intelligence-empty"><CheckCircle2 size={42}/><div><h2>Tekrar kuyruğun temiz</h2><p>Henüz yanlış cevap bulunmuyor. Yeni ders ve quiz sonuçları geldikçe akıllı tekrar otomatik hazırlanır.</p><Link className="button button-primary" href="/courses">Derslere Git</Link></div></section>;
  if (!current) return <section className="placement-result-card"><div className="placement-result-level"><CheckCircle2/><small>Bugünkü tekrar</small><strong>%100</strong><span>{payload.total} öğe tamamlandı</span></div><div className="placement-result-content"><span className="eyebrow">AKILLI TEKRAR TAMAMLANDI</span><h1>Zayıf noktalarını hedefleyerek çalıştın.</h1><p>Yeni yanlışlar oluştuğunda tekrar kuyruğun otomatik güncellenir.</p><div className="placement-result-actions"><Link className="button button-primary" href="/study-plan">Günlük Plana Dön</Link><button className="button button-secondary" onClick={()=>load(true)}><RefreshCw size={17}/>Kuyruğu Yenile</button></div></div></section>;

  const canSubmit = current.type === "CONCEPT" || (typeof answer === "string" ? answer.trim().length > 0 : typeof answer === "boolean");
  return <section className="review-shell"><div className="review-header"><div><span className="eyebrow">AKILLI TEKRAR</span><h2>{current.unitTitle}</h2><p>{current.skill}</p></div><div><strong>{payload.completed}/{payload.total}</strong><span>tamamlandı</span></div></div><Progress value={completionPercent} label={`Tekrar ilerlemesi · %${completionPercent}`}/><article className="review-card"><div className="review-meta"><span className="level-badge">{current.courseId.toUpperCase()}</span><span>{current.type === "CONCEPT" ? "Konu tekrarı" : "Hedefli soru"}</span></div><h2>{current.prompt}</h2>{current.type === "MULTIPLE_CHOICE" ? <div className="placement-options">{current.options?.map((item,index)=><button key={item.id} className={answer === item.value ? "selected" : ""} onClick={()=>{setAnswer(item.value);setFeedback(null);}}><span>{String.fromCharCode(65+index)}</span>{item.label}</button>)}</div> : current.type === "TRUE_FALSE" ? <div className="placement-options two"><button className={answer === true ? "selected" : ""} onClick={()=>{setAnswer(true);setFeedback(null);}}>Doğru</button><button className={answer === false ? "selected" : ""} onClick={()=>{setAnswer(false);setFeedback(null);}}>Yanlış</button></div> : current.type === "CONCEPT" ? <div className="concept-review"><CircleAlert/><p>Bu konu için ders notlarına dönüp önerilen bölümü tekrar et. Ardından tamamlandı olarak işaretle.</p><Link className="button button-secondary" href={current.href}>Ders Notlarını Aç<ArrowRight size={17}/></Link></div> : <label className="field"><span>Cevabın</span><input value={typeof answer === "string" ? answer : ""} onChange={(event)=>{setAnswer(event.target.value);setFeedback(null);}} placeholder="Cevabını yaz"/></label>}
      {feedback?<div className={`review-feedback ${feedback.correct ? "correct" : "wrong"}`}><strong>{feedback.correct ? "Doğru cevap" : "Tekrar dene"}</strong><p>{feedback.explanation}</p>{feedback.correctAnswer !== undefined?<small>Doğru cevap: {String(feedback.correctAnswer)}</small>:null}</div>:null}{error?<div className="auth-message auth-error">{error}</div>:null}<div className="placement-actions"><button className="button button-ghost" onClick={()=>load(true)}><RefreshCw size={17}/>Listeyi Yenile</button>{feedback?.correct?<button className="button button-primary" onClick={next}>Sonraki Tekrar<ArrowRight size={17}/></button>:<button className="button button-primary" disabled={!canSubmit || submitting} onClick={check}>{submitting ? "Kontrol ediliyor..." : current.type === "CONCEPT" ? "Tekrarı Tamamladım" : "Kontrol Et"}</button>}</div></article></section>;
}
