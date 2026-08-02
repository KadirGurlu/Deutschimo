"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CompetencyOverview } from "@/components/assessment/competency-overview";

export default function CompetencyPage() {
  return <div className="dashboard-shell"><AppSidebar active="competency"/><section className="dashboard-main"><header className="section-head"><div><span className="eyebrow">V17.0 · AKILLI ÖLÇME</span><h1 className="section-title">Yetkinlik Haritası</h1><p className="section-copy">Her cevap; öğrenme hedefi, konu etiketi, zorluk seviyesi ve cevaplama süresiyle birlikte değerlendirilir.</p></div></header><CompetencyOverview/></section></div>;
}
