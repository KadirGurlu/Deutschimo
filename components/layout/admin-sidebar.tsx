import Link from "next/link";

export function AdminSidebar({ active }: { active: "dashboard" | "courses" }) {
  return <aside className="admin-sidebar"><h2>Deutschimo Admin</h2><nav><Link className={active === "dashboard" ? "active" : ""} href="/admin">Genel Bakış</Link><Link className={active === "courses" ? "active" : ""} href="/admin/courses">İçerik Yönetimi</Link><Link href="/admin">Kullanıcılar</Link><Link href="/admin">Eğitmenler</Link><Link href="/admin">Sınavlar</Link><Link href="/admin">Abonelikler</Link><Link href="/admin">Raporlar</Link><Link href="/admin">Sistem Ayarları</Link></nav></aside>;
}
