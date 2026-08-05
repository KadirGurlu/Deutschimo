import Link from "next/link";
import { BarChart3, BookOpenText, CalendarCheck2, FlaskConical, Gauge, GraduationCap, Languages, PenLine, RotateCcw, Settings, UserRound, MapPinned } from "lucide-react";

export function AppSidebar({ active }: { active: string }) {
  const items = [
    [Gauge, "Öğrenci Paneli", "/dashboard", "dashboard"],
    [BookOpenText, "Kurslar", "/courses", "courses"],
    [PenLine, "Yazma Koçu", "/writing-coach", "writing-coach"],
    [GraduationCap, "Seviye Testi", "/placement-test", "placement"],
    [RotateCcw, "Akıllı Tekrar", "/smart-review", "smart-review"],
    [CalendarCheck2, "Günlük Plan", "/study-plan", "study-plan"],
    [FlaskConical, "Beceri Laboratuvarı", "/skills", "skills"],
    [Languages, "Kelime Setlerim", "/vocabulary", "vocabulary"],
    [BarChart3, "İlerleme", "/progress", "progress"],
    [MapPinned, "Gerçek Almanya Modu", "/real-germany", "real-germany"],
    [UserRound, "Profil", "/profile", "profile"],
    [Settings, "Ayarlar", "/profile", "settings"],
  ] as const;

  return (
    <aside className="app-sidebar">
      <nav aria-label="Öğrenci menüsü">
        {items.map(([Icon, label, href, key]) => (
          <Link key={key} href={href} className={active === key ? "active" : ""}>
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
