import { AppSidebar } from "@/components/layout/app-sidebar";
import { ListeningLab } from "@/components/skills/listening-lab";
import { requireUser } from "@/lib/auth/authorization";

export default async function ListeningPage(){await requireUser();return <div className="dashboard-shell"><AppSidebar active="skills"/><main className="dashboard-main"><ListeningLab/></main></div>;}
