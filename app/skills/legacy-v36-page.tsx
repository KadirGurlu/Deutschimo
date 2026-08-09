import { AppSidebar } from "@/components/layout/app-sidebar";
import { SkillLabOverview } from "@/components/skills/skill-lab-overview";
import { requireUser } from "@/lib/auth/authorization";

export default async function SkillsPage(){
  await requireUser();
  return <div className="dashboard-shell"><AppSidebar active="skills"/><main className="dashboard-main"><SkillLabOverview/></main></div>;
}
