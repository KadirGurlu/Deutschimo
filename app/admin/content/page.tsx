import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ContentManager } from "@/components/admin/content-manager";

export default function AdminContentPage() {
  return <div className="admin-shell"><AdminSidebar active="content"/><main className="admin-main admin-main-wide"><ContentManager/></main></div>;
}
