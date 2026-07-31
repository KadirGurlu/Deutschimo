"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { SyncStatusIndicator } from "@/components/auth/sync-status";
import { clearCurrentLearningCache, setActiveLearningUser } from "@/lib/storage/learning-storage";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";

  async function logout() {
    clearCurrentLearningCache();
    setActiveLearningUser(null);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Deutschimo ana sayfa">
          <span className="brand-mark">D</span><span>Deutschimo</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <button className="explore-button" onClick={() => setOpen(!open)}>Kursları Keşfet <ChevronDown size={16} /></button>
          <Link href="/courses">Seviyeler</Link>
          <Link href="/exams">Sınav Hazırlık</Link>
          <Link href="/vocabulary">Kaynaklar</Link>
        </nav>
        <div className="header-actions">
          {authenticated ? <>
            <SyncStatusIndicator/>
            <Link href="/dashboard" className="login-link"><UserRound size={18}/> {session.user.firstName ?? session.user.name ?? "Hesabım"}</Link>
            <button className="icon-button" aria-label="Çıkış yap" title="Çıkış yap" onClick={logout}><LogOut size={19}/></button>
          </> : <>
            <Link href="/auth" className="login-link">Giriş Yap</Link>
            <Link href="/auth" className="button button-primary header-cta">Kayıt Ol</Link>
          </>}
          <button className="icon-button mobile-only" aria-label="Bildirimler"><Bell size={20} /></button>
          <button className="icon-button mobile-only" aria-label="Menüyü aç" onClick={() => setOpen(!open)}><Menu size={22} /></button>
        </div>
      </div>
      {open ? (
        <div className="mega-menu">
          <div><strong>Seviyeye Göre</strong><Link href="/courses/a1">A1 Başlangıç</Link><Link href="/courses/a2">A2 Temel</Link><Link href="/courses/b1">B1 Orta</Link><Link href="/courses/b2">B2 Orta-İleri</Link></div>
          <div><strong>Beceriye Göre</strong><Link href="/courses">Gramer</Link><Link href="/vocabulary">Kelime</Link><Link href="/writing">Yazma</Link><Link href="/courses">Okuma</Link></div>
          <div><strong>Sınava Göre</strong><Link href="/exams">TestDaF</Link><Link href="/exams">TELC</Link><Link href="/exams">Goethe-Zertifikat</Link><Link href="/exams">Üniversite Hazırlık</Link></div>
          <div><strong>Hedefe Göre</strong><Link href="/courses">Günlük Almanca</Link><Link href="/courses">Akademik Almanca</Link><Link href="/courses">İş Almancası</Link><Link href="/courses">Almanya'da Yaşam</Link></div>
        </div>
      ) : null}
    </header>
  );
}
