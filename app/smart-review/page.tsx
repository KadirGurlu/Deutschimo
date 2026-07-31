import { AppSidebar } from "@/components/layout/app-sidebar";
import { SmartReview } from "@/components/intelligence/smart-review";
import { requireUser } from "@/lib/auth/authorization";

export default async function SmartReviewPage() {
  await requireUser();
  return <div className="dashboard-shell"><AppSidebar active="smart-review"/><main className="dashboard-main"><SmartReview/></main></div>;
}
