"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarCheck2, GraduationCap, RefreshCw, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { IntelligenceOverview } from "@/types/intelligence";

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0,10);
}

export function IntelligenceOverviewPanel() {
  const [overview, setOverview] = useState<IntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const date = useMemo(localDate, []);

  useEffect(()=>{
    fetch(`/api/intelligence/overview?date=${date}`, {cache:"no-store"})
      .then(async response=>{ const payload=await response.json() as {overview?:IntelligenceOverview}; if(response.ok&&payload.overview)setOverview(payload.overview); })
      .finally(()=>setLoading(false));
  },[date]);

  if (loading) return <section className="panel intelligence-loading compact"><BrainCircuit className="spin-soft"/><div><h3>Öğrenme zekâsı hazırlanıyor</h3><p>Kişisel planın ve tekrar sıran getiriliyor.</p></div></section>;
  if (!overview) return null;
  const planPercent = overview.dailyPlan.plannedMinutes ? Math.round((overview.dailyPlan.completedMinutes/overview.dailyPlan.plannedMinutes)*100) : 0;
  const weak = overview.insights.weakTopics[0];

  return <section className="panel"><div className="section-head"><div><span className="eyebrow">V12 · ÖĞRENME ZEKÂSI</span><h2>Kişisel öğrenme merkezi</h2></div><Link className="button button-secondary" href="/study-plan">Tüm Planı Aç<ArrowRight size={17}/></Link></div><div className="intelligence-dashboard-grid"><Link href="/placement-test" className="intelligence-dashboard-card"><GraduationCap/><div><small>Seviye belirleme</small><strong>{overview.placement ? `${overview.placement.recommendedLevel} · %${overview.placement.totalScore}` : "Henüz tamamlanmadı"}</strong><span>{overview.placement ? "Sonucun günlük planına uygulandı" : "24 soruluk sınavı tamamla"}</span></div></Link><Link href="/weak-topics" className="intelligence-dashboard-card"><BrainCircuit/><div><small>Zayıf konu tespiti</small><strong>{weak ? `${weak.skill} · %${weak.accuracy}` : "Yeni veri bekleniyor"}</strong><span>{weak ? weak.unitTitle : "Alıştırma çözdükçe analiz gelişir"}</span></div></Link><Link href="/smart-review" className="intelligence-dashboard-card"><RotateCcw/><div><small>Akıllı tekrar</small><strong>{overview.review.remaining} öğe bekliyor</strong><span>{overview.review.completed}/{overview.review.total} tekrar tamamlandı</span></div></Link><Link href="/study-plan" className="intelligence-dashboard-card"><CalendarCheck2/><div><small>Bugünkü plan</small><strong>{overview.dailyPlan.completedMinutes}/{overview.dailyPlan.plannedMinutes} dakika</strong><Progress value={planPercent} label={`%${planPercent} tamamlandı`}/></div></Link></div></section>;
}
