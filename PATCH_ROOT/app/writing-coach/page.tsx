import { AppSidebar } from "@/components/layout/app-sidebar";
import { WritingCoach } from "@/components/writing-coach/writing-coach";
import { requireUser } from "@/lib/auth/authorization";
import type { WritingCoachLevel } from "@/types/writing-coach";

const levels = new Set<WritingCoachLevel>(["A1", "A2", "B1", "B2"]);

export default async function WritingCoachPage() {
  const { user } = await requireUser();
  const initialLevel = levels.has(user.currentLevel as WritingCoachLevel)
    ? user.currentLevel as WritingCoachLevel
    : "A1";

  return (
    <div className="dashboard-shell">
      <AppSidebar active="writing-coach" />
      <main className="dashboard-main">
        <WritingCoach initialLevel={initialLevel} />
      </main>
    </div>
  );
}
