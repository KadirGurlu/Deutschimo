"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenText, Headphones, Mic2, PenLine, Sparkles, Trophy } from "lucide-react";
import type { SkillOverview, SkillType } from "@/types/skills";

const cards: Array<{ skill: SkillType; title: string; description: string; href: string; icon: typeof Headphones }> = [
  { skill:"LISTENING", title:"Dinleme Laboratuvarı", description:"Metni görmeden dinle, ana fikri ve ayrıntıları çöz, ardından transkriptle çalış.", href:"/listening", icon:Headphones },
  { skill:"SPEAKING", title:"Konuşma Laboratuvarı", description:"Mikrofonla cevap ver, konuşmanı yazıya dönüştür ve görev odaklı geri bildirim al.", href:"/speaking", icon:Mic2 },
  { skill:"READING", title:"Okuma Laboratuvarı", description:"Gerçek metin türlerini oku, çıkarım yap ve bilinmeyen kelimeleri defterine ekle.", href:"/reading", icon:BookOpenText },
  { skill:"WRITING", title:"Yazma Laboratuvarı", description:"Seviyene uygun görev yaz, dört ölçütte değerlendirme ve düzeltme önerileri al.", href:"/writing", icon:PenLine },
];

export function SkillLabOverview() {
  const [overview, setOverview] = useState<SkillOverview | null>(null);
  useEffect(() => {
    fetch("/api/skills/overview", { cache:"no-store" })
      .then(async (response) => response.ok ? (await response.json() as { overview: SkillOverview }).overview : null)
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  return <>
    <section className="skills-hero">
      <div><span className="eyebrow">V13 · BECERİ LABORATUVARLARI</span><h1>Almancayı yalnızca öğrenme, kullan.</h1><p>Dinleme, konuşma, okuma ve yazma becerilerini gerçek yaşam görevleriyle ayrı ayrı geliştir. Her çalışma hesabına kaydedilir ve gelişim raporuna eklenir.</p><div className="skills-hero-points"><span><Sparkles size={17}/>A1–B2 uyumlu görevler</span><span><Trophy size={17}/>Ölçülebilir geri bildirim</span></div></div>
      <aside><strong>{overview ? Object.values(overview.totals).reduce((sum,value)=>sum+value,0) : 0}</strong><span>Tamamlanan laboratuvar görevi</span><small>{overview?.vocabularyCount ?? 0} kelime kişisel defterinde</small></aside>
    </section>
    <section className="skill-lab-grid">{cards.map(({skill,title,description,href,icon:Icon})=>{
      const average=overview?.averages[skill] ?? 0; const count=overview?.totals[skill] ?? 0;
      return <Link href={href} className="skill-lab-card" key={skill}><div className="skill-lab-icon"><Icon size={28}/></div><div><span className="eyebrow">{count} çalışma</span><h2>{title}</h2><p>{description}</p><div className="skill-card-footer"><span>{count ? `Ortalama %${average}` : "İlk görevini başlat"}</span><strong>Laboratuvarı Aç <ArrowRight size={17}/></strong></div></div></Link>;
    })}</section>
    {overview?.recent.length ? <section className="panel skill-recent"><div className="section-head"><div><span className="eyebrow">SON ÇALIŞMALAR</span><h2>Beceri geçmişin</h2></div></div><div className="skill-recent-list">{overview.recent.slice(0,6).map((attempt)=><article key={attempt.id}><span className={`skill-dot ${attempt.skill.toLowerCase()}`}/><div><strong>{skillLabel(attempt.skill)} · {attempt.level}</strong><small>{new Date(attempt.completedAt).toLocaleString("tr-TR")}</small></div><b>%{attempt.score}</b></article>)}</div></section> : null}
  </>;
}

function skillLabel(skill: SkillType) {
  return skill === "LISTENING" ? "Dinleme" : skill === "SPEAKING" ? "Konuşma" : skill === "READING" ? "Okuma" : "Yazma";
}
