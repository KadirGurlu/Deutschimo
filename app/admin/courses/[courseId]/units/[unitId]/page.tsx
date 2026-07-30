import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ContentManager } from "@/components/admin/content-manager";
export default async function AdminUnitPage({ params }: { params: Promise<{ courseId: string; unitId: string }> }) { const { courseId, unitId } = await params; return <div className="admin-shell"><AdminSidebar active="content"/><main className="admin-main admin-main-wide"><ContentManager initialCourseId={courseId} initialUnitId={unitId}/></main></div>; }
