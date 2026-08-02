"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { useAssessmentOverview } from "@/components/assessment/use-assessment-overview";
import { skillLabels } from "@/components/assessment/competency-overview";

export function ErrorHistory() {
  const { overview, loading, error, reload } = useAssessmentOverview();
  if (loading) return <section className="panel assessment-loading"><RefreshCw/><p>Hata geçmişi yükleniyor…</p></section>;
  if (error) return <section className="panel assessment-empty"><AlertTriangle/><h2>Hata geçmişi alınamadı</h2><p>{error}</p><button className="button button-secondary" onClick={() => void reload()}>Yeniden Dene</button></section>;
  if (!overview?.errors.length) return <section className="panel assessment-empty"><CheckCircle2/><h2>Açık hata bulunmuyor</h2><p>Yanlış yaptığın bir soruyu daha sonra doğru yanıtladığında ilgili kayıt otomatik olarak çözülmüş sayılır.</p><Link className="button button-primary" href="/competency">Yetkinlik Haritası</Link></section>;

  return <section className="error-history-list">{overview.errors.map((item) => {
    const courseId = item.unitId?.split("-")[0];
    const href = courseId && item.unitId ? `/learn/${courseId}/${item.unitId}` : "/courses";
    return <article className="error-history-card" key={item.id}><div className="error-card-head"><div><span className="level-badge">{item.level} · {skillLabels[item.skill]}</span><h2>{item.objectiveTitle}</h2></div><span className="error-count">{item.occurrenceCount} kez</span></div><p className="error-topic">{item.topic}</p>{item.explanation ? <div className="error-explanation"><strong>Neden?</strong><p>{item.explanation}</p></div> : null}<footer><small>Son hata: {new Date(item.lastOccurredAt).toLocaleDateString("tr-TR")}</small><Link href={href}>İlgili Dersi Tekrarla <ArrowRight size={16}/></Link></footer></article>;
  })}</section>;
}
