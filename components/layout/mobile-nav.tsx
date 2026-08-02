"use client";

import Link from "next/link";
import { BarChart3, BookOpen, FlaskConical, Home, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

export function MobileNav() {
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav className="mobile-nav" aria-label="Mobil alt menü">
      <Link href="/dashboard"><Home size={20} /><span>Panel</span></Link>
      <Link href="/skills"><FlaskConical size={20} /><span>Beceriler</span></Link>
      <Link href="/courses"><BookOpen size={20} /><span>Kurslar</span></Link>
      <Link href="/progress"><BarChart3 size={20} /><span>İlerleme</span></Link>
      <Link href="/profile"><UserRound size={20} /><span>Profil</span></Link>
    </nav>
  );
}
