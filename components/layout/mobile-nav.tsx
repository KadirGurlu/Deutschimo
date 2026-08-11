"use client";

import Link from "next/link";
import { BarChart3, BookOpen, FlaskConical, Home, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const links = [
  [Home, "Panel", "/dashboard"],
  [FlaskConical, "Beceriler", "/skills"],
  [BookOpen, "Kurslar", "/courses"],
  [BarChart3, "İlerleme", "/progress"],
  [UserRound, "Profil", "/profile"],
] as const;

export function MobileNav() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated") return null;

  return (
    <nav className="mobile-nav" aria-label="Mobil alt menü">
      {links.map(([Icon, label, href]) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={current ? "page" : undefined}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
