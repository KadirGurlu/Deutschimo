import Link from "next/link";
import { AlertTriangle,BookOpenText,FileClock,Gauge,ShieldCheck,Sparkles,Users } from "lucide-react";
type AdminSection="dashboard"|"content"|"quality"|"users"|"audit"|"security"|"errors";
export function AdminSidebar({active}:{active:AdminSection}){
  const items=[[Gauge,"Genel Bakış","/admin","dashboard"],[BookOpenText,"Content Studio","/admin/content","content"],[Sparkles,"Kalite Merkezi","/admin/quality","quality"],[Users,"Kullanıcılar","/admin/users","users"],[FileClock,"Denetim Geçmişi","/admin/audit","audit"],[ShieldCheck,"Güvenlik","/admin/security","security"],[AlertTriangle,"Hata Merkezi","/admin/errors","errors"]] as const;
  return <aside className="admin-sidebar"><h2>Deutschimo Admin</h2><nav>{items.map(([Icon,label,href,key])=><Link className={active===key?"active":""} href={href} key={key}><Icon size={18}/>{label}</Link>)}</nav><div className="admin-sidebar-note"><strong>V44 içerik modeli</strong><p>Veritabanı + sürüm geçmişi + kontrollü yayın</p></div></aside>
}
