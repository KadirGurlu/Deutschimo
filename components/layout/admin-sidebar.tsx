import Link from "next/link";
import { BookOpenText, FileClock, Gauge, ShieldCheck, Users } from "lucide-react";

export function AdminSidebar({ active }: { active: "dashboard" | "content" | "users" | "audit" | "security" }) {
  const items = [
    [Gauge, "Genel Bakış", "/admin", "dashboard"],
    [BookOpenText, "İçerik Yönetimi", "/admin/content", "content"],
    [Users, "Kullanıcılar", "/admin/users", "users"],
    [FileClock, "Denetim Geçmişi", "/admin/audit", "audit"],
    [ShieldCheck, "Güvenlik", "/admin/security", "security"],
  ] as const;
  return <aside className="admin-sidebar"><h2>Deutschimo Admin</h2><nav>{items.map(([Icon, label, href, key]) => <Link className={active === key ? "active" : ""} href={href} key={key}><Icon size={18}/>{label}</Link>)}</nav><div className="admin-sidebar-note"><strong>İçerik modeli</strong><p>Yazılı ders anlatımı + alıştırma + ünite tamamlama</p></div></aside>;
}
