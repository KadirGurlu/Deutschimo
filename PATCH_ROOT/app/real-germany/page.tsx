import { AppSidebar } from "@/components/layout/app-sidebar";
import { RealGermanyMode } from "@/components/real-germany/real-germany-mode";
import { requireUser } from "@/lib/auth/authorization";
import type { RealGermanyLevel } from "@/types/real-germany";

const levels = new Set<RealGermanyLevel>(["A1", "A2", "B1", "B2"]);

export default async function RealGermanyPage() {
  const { user } = await requireUser();
  const initialLevel = levels.has(user.currentLevel as RealGermanyLevel)
    ? user.currentLevel as RealGermanyLevel
    : "A1";

  return (
    <div className="dashboard-shell">
      <AppSidebar active="real-germany" />
      <main className="dashboard-main">
        <RealGermanyMode initialLevel={initialLevel} />
      </main>
    </div>
  );
}
