import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PlacementTest } from "@/components/intelligence/placement-test";
import { requireUser } from "@/lib/auth/authorization";

export default async function PlacementTestPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const onboardingFlow = params.onboarding === "1";
  return <div className="dashboard-shell"><AppSidebar active="placement"/><main className="dashboard-main">
    {onboardingFlow ? <section className="panel" style={{marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}><div><span className="eyebrow">V32 ONBOARDING</span><h2 style={{margin:"4px 0"}}>Seviyeni belirle, sonra kişisel planına dön.</h2><p style={{margin:0}}>Testi tamamladığında sonucunu otomatik olarak onboarding planında kullanacağız.</p></div><Link className="button button-secondary" href="/onboarding?from=placement"><ArrowLeft size={17}/> Onboarding'e dön</Link></section> : null}
    <PlacementTest/>
  </main></div>;
}
