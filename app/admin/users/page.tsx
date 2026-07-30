import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { UserManager } from "@/components/admin/user-manager";

export default function AdminUsersPage() {
  return <div className="admin-shell"><AdminSidebar active="users"/><main className="admin-main"><div className="section-head"><div><span className="eyebrow">KULLANICI YÖNETİMİ</span><h1 className="section-title">Kayıtlı kullanıcılar</h1><p className="section-copy">Öğrenci hesaplarını görüntüle, rol ve durum bilgilerini yönet.</p></div></div><section className="panel" style={{marginTop:28}}><UserManager/></section></main></div>;
}
