"use client";

import Link from "next/link";
import { BrainCircuit, CircleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAssessmentOverview } from "@/components/assessment/use-assessment-overview";
import { skillLabels } from "@/components/assessment/competency-overview";

export function CompetencyDashboardCard() {
  const { overview, loading } = useAssessmentOverview();
  if (loading || !overview || overview.totalEvidence === 0) return null;
  const weakest = overview.competencies[0];
  return <section className="panel competency-dashboard-card"><div className="section-head"><div><span className="eyebrow">V17.0 · ÖLÇME ALTYAPISI</span><h2>Yetkinlik haritan</h2></div><Link href="/competency">Ayrıntıları Gör</Link></div><div className="competency-dashboard-body"><div className="competency-main-score"><BrainCircuit/><strong>%{overview.overallMastery}</strong><span>Genel yetkinlik</span></div><div><Progress value={overview.overallMastery} label={`${overview.totalEvidence} ölçme kanıtı`}/>{weakest ? <p><CircleAlert size={17}/><span>Öncelik: <strong>{weakest.title}</strong> · {skillLabels[weakest.skill]} %{weakest.mastery}</span></p> : null}</div><Link className="button button-secondary" href="/mistakes">{overview.unresolvedErrors} Açık Hatayı İncele</Link></div></section>;
}
