import Link from "next/link";
import { BarChart3, BookOpen, Compass, Home, UserRound } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobil alt menü">
      <Link href="/"><Home size={20} /><span>Ana Sayfa</span></Link>
      <Link href="/courses"><Compass size={20} /><span>Keşfet</span></Link>
      <Link href="/learn/a1/a1-u01"><BookOpen size={20} /><span>Öğren</span></Link>
      <Link href="/progress"><BarChart3 size={20} /><span>İlerleme</span></Link>
      <Link href="/profile"><UserRound size={20} /><span>Profil</span></Link>
    </nav>
  );
}
