import { AppSidebar } from "@/components/layout/app-sidebar";
import { ReadingLab } from "@/components/skills/reading-lab";
import { requireUser } from "@/lib/auth/authorization";

export default async function ReadingPage(){await requireUser();return <div className="dashboard-shell"><AppSidebar active="skills"/><main className="dashboard-main"><ReadingLab/></main></div>;}
