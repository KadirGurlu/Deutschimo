import Link from "next/link";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminOverview } from "@/components/admin/admin-overview";

export default function AdminPage() {
  return <div className="admin-shell"><AdminSidebar active="dashboard"/><main className="admin-main"><div className="section-head"><div><span className="eyebrow">YÖNETİM PANELİ</span><h1 className="section-title">Deutschimo genel bakış</h1><p className="section-copy">Kullanıcıları ve A1-B2 yazılı eğitim içeriklerini tek merkezden yönet.</p></div><Link className="button button-primary" href="/admin/content">İçerik Düzenleyiciyi Aç</Link></div><AdminOverview/></main></div>;
}
