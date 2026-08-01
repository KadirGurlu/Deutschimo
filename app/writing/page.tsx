import { AppSidebar } from "@/components/layout/app-sidebar";
import { WritingLab } from "@/components/skills/writing-lab";
import { requireUser } from "@/lib/auth/authorization";

export default async function WritingPage(){await requireUser();return <div className="dashboard-shell"><AppSidebar active="skills"/><main className="dashboard-main"><WritingLab/></main></div>;}
