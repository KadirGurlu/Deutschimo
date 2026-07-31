"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { IntelligenceInsights } from "@/types/intelligence";

export function WeakTopicsPanel() {
  const [insights, setInsights] = useState<IntelligenceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/insights", { cache: "no-store" });
      const payload = await response.json() as { insights?: IntelligenceInsights; error?: string };
      if (!response.ok || !payload.insights) throw new Error(payload.error ?? "Analiz yüklenemedi.");
      setInsights(payload.insights);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Analiz yüklenemedi."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); },[]);

  if (loading) return <section className="panel intelligence-loading"><BrainCircuit className="spin-soft"/><h2>Öğrenme verilerin analiz ediliyor</h2><p>Yanlışlar, quiz sonuçları ve tekrar örüntüleri inceleniyor.</p></section>;
  if (error) return <section className="panel"><div className="auth-message auth-error">{error}</div><button className="button button-secondary" onClick={load}><RefreshCw size={17}/>Tekrar Dene</button></section>;
  if (!insights) return null;

  return <div className="intelligence-stack">
    {!insights.hasEnoughData?<section className="intelligence-empty"><BrainCircuit size={38}/><div><h2>Henüz yeterli çözüm verisi yok</h2><p>En az üç alıştırma veya bir ünite quizini tamamladığında zayıf konu analizi ayrıntılı hâle gelir.</p><Link className="button button-primary" href="/courses">Bir Derse Başla</Link></div></section>:null}
    <section className="panel"><div className="section-head"><div><span className="eyebrow">HEDEFLİ GELİŞİM</span><h2>Zayıf konu haritan</h2></div><button className="button button-secondary" onClick={load}><RefreshCw size={17}/>Yeniden Analiz Et</button></div>
      {insights.weakTopics.length?<div className="weak-topic-list">{insights.weakTopics.map((item)=><article className={`weak-topic-card severity-${item.severity.toLowerCase()}`} key={item.id}><div className="weak-topic-head"><span><AlertTriangle size={20}/>{item.skill}</span><span className="status draft">{item.severity === "CRITICAL" ? "Kritik" : item.severity === "HIGH" ? "Yüksek öncelik" : "Tekrar edilmeli"}</span></div><h3>{item.unitTitle}</h3><Progress value={item.accuracy} label={`Başarı %${item.accuracy} · ${item.attemptCount} ölçüm`}/><p>{item.recommendation}</p><div className="weak-topic-footer"><small>Analiz güveni: {item.confidence === "HIGH" ? "yüksek" : item.confidence === "MEDIUM" ? "orta" : "başlangıç"}</small><Link href={item.href}>Ders Notlarına Dön<ArrowRight size={16}/></Link></div></article>)}</div>:<div className="intelligence-empty compact"><ShieldCheck/><div><h3>Belirgin bir zayıf alan bulunmadı</h3><p>Mevcut sonuçların dengeli görünüyor. Yeni alıştırmalar çözdükçe analiz güncellenir.</p></div></div>}
    </section>
    <section className="panel"><span className="eyebrow">GÜÇLÜ YÖNLER</span><h2>Koruman gereken kazanımlar</h2>{insights.strengths.length?<div className="strength-grid">{insights.strengths.map((item)=><article key={item.id}><CheckCircle2/><div><strong>{item.title}</strong><span>%{item.accuracy} · {item.attemptCount} ölçüm</span></div></article>)}</div>:<p className="section-copy">Daha fazla soru çözdüğünde güçlü alanların burada gösterilecek.</p>}</section>
  </div>;
}
