import Link from "next/link";
import { BarChart3, BookOpen, BrainCircuit, CalendarCheck2, ClipboardCheck, FlaskConical, Gauge, GraduationCap, Languages, RotateCcw, Settings, UserRound } from "lucide-react";

export function AppSidebar({ active }: { active: string }) {
  const items = [
    [Gauge, "Dashboard", "/dashboard", "dashboard"],
    [BookOpen, "Kurslarım", "/courses", "courses"],
    [GraduationCap, "Seviye Testi", "/placement-test", "placement"],
    [BrainCircuit, "Zayıf Konular", "/weak-topics", "weak-topics"],
    [RotateCcw, "Akıllı Tekrar", "/smart-review", "smart-review"],
    [CalendarCheck2, "Günlük Plan", "/study-plan", "study-plan"],
    [FlaskConical, "Beceri Laboratuvarı", "/skills", "skills"],
    [Languages, "Kelime", "/vocabulary", "vocabulary"],
    [ClipboardCheck, "Sınavlar", "/exams", "exams"],
    [BarChart3, "İlerleme", "/progress", "progress"],
    [UserRound, "Profil", "/profile", "profile"],
    [Settings, "Ayarlar", "/profile", "settings"]
  ] as const;
  return <aside className="app-sidebar"><nav>{items.map(([Icon,label,href,key])=><Link key={key} href={href} className={active === key ? "active" : ""}><Icon size={19}/>{label}</Link>)}</nav></aside>;
}
