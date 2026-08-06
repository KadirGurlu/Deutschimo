import Link from "next/link";
import { AlertTriangle, BookOpenText, FileClock, Gauge, ShieldCheck, Users } from "lucide-react";

type AdminSection = "dashboard" | "content" | "users" | "audit" | "security" | "errors";

export function AdminSidebar({ active }: { active: AdminSection }) {
  const items = [
    [Gauge, "Genel Bakış", "/admin", "dashboard"],
    [BookOpenText, "İçerik Yönetimi", "/admin/content", "content"],
    [Users, "Kullanıcılar", "/admin/users", "users"],
    [FileClock, "Denetim Geçmişi", "/admin/audit", "audit"],
    [ShieldCheck, "Güvenlik", "/admin/security", "security"],
    [AlertTriangle, "Hata Merkezi", "/admin/errors", "errors"],
  ] as const;
  return <aside className="admin-sidebar"><h2>Deutschimo Admin</h2><nav>{items.map(([Icon, label, href, key]) => <Link className={active === key ? "active" : ""} href={href} key={key}><Icon size={18}/>{label}</Link>)}</nav><div className="admin-sidebar-note"><strong>İçerik modeli</strong><p>Yazılı ders anlatımı + alıştırma + ünite tamamlama</p></div></aside>;
}
