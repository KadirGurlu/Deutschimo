"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Languages } from "lucide-react";
import type { VocabularyStats } from "@/types/vocabulary";
import { Progress } from "@/components/ui/progress";

export function VocabularyDashboardCard() {
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  useEffect(() => { fetch("/api/skills/vocabulary", { cache:"no-store" }).then(async (response)=>response.ok?(await response.json() as {stats:VocabularyStats}).stats:null).then(setStats).catch(()=>setStats(null)); }, []);
  return <section className="panel vocab-dashboard-card"><div className="section-head"><div><span className="eyebrow">V14 · KELİME HAFIZASI</span><h2>Bugünkü kelime tekrarın</h2></div><Link className="button button-secondary" href="/vocabulary">Çalışmaya başla<ArrowRight size={17}/></Link></div><div className="vocab-dashboard-grid"><article><Languages/><div><strong>{stats?.total??0}</strong><span>kelime defterinde</span></div></article><article><BrainCircuit/><div><strong>{stats?.due??0}</strong><span>tekrar bekliyor</span></div></article><article><CheckCircle2/><div><strong>{stats?.mastered??0}</strong><span>ustalaşıldı</span></div></article></div><Progress value={stats?.averageMastery??0} label={`Ortalama kelime ustalığı %${stats?.averageMastery??0}`}/></section>;
}
