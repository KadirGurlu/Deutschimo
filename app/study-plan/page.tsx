import { AppSidebar } from "@/components/layout/app-sidebar";
import { DailyPlan } from "@/components/intelligence/daily-plan";
import { requireUser } from "@/lib/auth/authorization";

export default async function StudyPlanPage() {
  await requireUser();
  return <div className="dashboard-shell"><AppSidebar active="study-plan"/><main className="dashboard-main"><DailyPlan/></main></div>;
}
