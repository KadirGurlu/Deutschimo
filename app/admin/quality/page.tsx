import { requireEditor } from "@/lib/auth/authorization";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { QualityDashboard } from "@/components/admin/quality-dashboard";
export default async function AdminQualityPage(){await requireEditor();return <div className="admin-shell"><AdminSidebar active="quality"/><main className="admin-main"><QualityDashboard/></main></div>}
