"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ErrorHistory } from "@/components/assessment/error-history";

export default function MistakesPage() {
  return <div className="dashboard-shell"><AppSidebar active="mistakes"/><section className="dashboard-main"><header className="section-head"><div><span className="eyebrow">KİŞİSEL HATA GEÇMİŞİ</span><h1 className="section-title">Hatalarım</h1><p className="section-copy">Tekrarlanan yanlışları konu ve öğrenme hedefi bazında gör. Aynı soruyu doğru yaptığında kayıt otomatik olarak çözülür.</p></div></header><ErrorHistory/></section></div>;
}
