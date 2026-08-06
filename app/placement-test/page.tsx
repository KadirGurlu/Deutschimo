import { AppSidebar } from "@/components/layout/app-sidebar";
import { PlacementTest } from "@/components/intelligence/placement-test";
import { requireUser } from "@/lib/auth/authorization";

export default async function PlacementTestPage() {
  await requireUser();
  return <div className="dashboard-shell"><AppSidebar active="placement"/><main className="dashboard-main"><PlacementTest/></main></div>;
}
