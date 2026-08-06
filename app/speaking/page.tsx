import { AppSidebar } from "@/components/layout/app-sidebar";
import { SpeakingLab } from "@/components/skills/speaking-lab";
import { requireUser } from "@/lib/auth/authorization";

export default async function SpeakingPage(){await requireUser();return <div className="dashboard-shell"><AppSidebar active="skills"/><main className="dashboard-main"><SpeakingLab/></main></div>;}
