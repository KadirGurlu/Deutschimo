"use client";

import Link from "next/link";
import { BrainCircuit, CheckCircle2, CircleAlert, Gauge, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAssessmentOverview } from "@/components/assessment/use-assessment-overview";
import type { AssessmentSkill } from "@/types/assessment";

export const skillLabels: Record<AssessmentSkill, string> = {
  GRAMMAR: "Dil bilgisi",
  VOCABULARY: "Kelime",
  COMMUNICATION: "İletişim",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
  PRONUNCIATION: "Telaffuz",
};

function masteryLabel(value: number) {
  if (value >= 85) return "Ustalaşıldı";
  if (value >= 70) return "Güçlü";
  if (value >= 50) return "Gelişiyor";
  return "Tekrar gerekli";
}

export function CompetencyOverview() {
  const { overview, loading, error, reload } = useAssessmentOverview();
  if (loading) return <section className="panel assessment-loading"><BrainCircuit/><p>Yetkinlik kanıtları hazırlanıyor…</p></section>;
  if (error) return <section className="panel assessment-empty"><CircleAlert/><h2>Yetkinlik verileri gösterilemedi</h2><p>{error}</p><button className="button button-secondary" onClick={() => void reload()}><RefreshCw size={16}/> Yeniden Dene</button></section>;
  if (!overview || overview.totalEvidence === 0) return <section className="panel assessment-empty"><BrainCircuit/><h2>Yetkinlik haritan oluşmaya hazır</h2><p>Bir alıştırmayı veya ünite testini tamamladığında öğrenme hedefleri, zorluk düzeyi ve hata geçmişi burada görünür.</p><Link className="button button-primary" href="/courses">İlk Kanıtı Oluştur</Link></section>;

  const weak = overview.competencies.slice(0, 8);
  return <div className="assessment-page-grid">
    <section className="assessment-metric-grid full-span">
      <Metric icon={<Gauge/>} label="Genel yetkinlik" value={`%${overview.overallMastery}`} note={`${overview.competencies.length} öğrenme hedefi`}/>
      <Metric icon={<CheckCircle2/>} label="Ölçme kanıtı" value={String(overview.totalEvidence)} note="Alıştırma ve test cevapları"/>
      <Metric icon={<CircleAlert/>} label="Açık hata" value={String(overview.unresolvedErrors)} note="Doğru cevapla çözülebilir"/>
      <Metric icon={<BrainCircuit/>} label="Ölçülen beceri" value={String(overview.skillSummaries.length)} note="Kişisel beceri profili"/>
    </section>

    <section className="panel"><div className="section-head"><div><span className="eyebrow">BECERİ PROFİLİ</span><h2>Yetkinlik dağılımı</h2></div><span className="level-badge">V17.0</span></div><div className="competency-skill-list">{overview.skillSummaries.map((item) => <article key={item.skill}><div><strong>{skillLabels[item.skill]}</strong><span>%{item.correctRate} doğru · {item.evidenceCount} kanıt</span></div><Progress value={item.mastery} label={`%${item.mastery}`}/></article>)}</div></section>

    <section className="panel"><div className="section-head"><div><span className="eyebrow">ÖNCELİK SIRASI</span><h2>Geliştirilecek hedefler</h2></div><Link href="/mistakes">Hataları Aç</Link></div><div className="objective-list">{weak.map((item) => <article key={item.objectiveCode}><div><span className="level-badge">{item.level} · {skillLabels[item.skill]}</span><strong>{item.title}</strong><p>{item.topic}</p></div><div className="objective-score"><strong>%{item.mastery}</strong><span>{masteryLabel(item.mastery)}</span><small>Güven %{item.confidence}</small></div></article>)}</div></section>
  </div>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>;
}
