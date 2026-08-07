import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { requireOnboardedUser } from "@/lib/auth/authorization";

export default async function DashboardPage() {
  await requireOnboardedUser();
  return <DashboardPageClient />;
}
