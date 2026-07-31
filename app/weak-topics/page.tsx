import { AppSidebar } from "@/components/layout/app-sidebar";
import { WeakTopicsPanel } from "@/components/intelligence/weak-topics-panel";
import { requireUser } from "@/lib/auth/authorization";

export default async function WeakTopicsPage() {
  await requireUser();
  return <div className="dashboard-shell"><AppSidebar active="weak-topics"/><main className="dashboard-main"><div><span className="eyebrow">V12 · ÖĞRENME ZEKÂSI</span><h1 className="section-title">Zayıf konu tespiti</h1><p className="section-copy">Yanlış cevapların, quiz skorların ve tekrar örüntülerin analiz edilerek öncelikli gelişim alanların belirlenir.</p></div><div style={{marginTop:28}}><WeakTopicsPanel/></div></main></div>;
}
