"use client";

import Link from "next/link";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Deutschimo ana sayfa">
          <span className="brand-mark">D</span><span>Deutschimo</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <button className="explore-button" onClick={() => setOpen(!open)}>Kursları Keşfet <ChevronDown size={16} /></button>
          <div className="header-search"><Search size={18} /><input aria-label="Kurs ara" placeholder="Kurs, seviye veya beceri ara" /></div>
          <Link href="/courses">Seviyeler</Link>
          <Link href="/exams">Sınav Hazırlık</Link>
          <Link href="/vocabulary">Kaynaklar</Link>
        </nav>
        <div className="header-actions">
          <Link href="/auth" className="login-link">Giriş Yap</Link>
          <Link href="/onboarding" className="button button-primary header-cta">Ücretsiz Başla</Link>
          <button className="icon-button mobile-only" aria-label="Bildirimler"><Bell size={20} /></button>
          <button className="icon-button mobile-only" aria-label="Menüyü aç" onClick={() => setOpen(!open)}><Menu size={22} /></button>
        </div>
      </div>
      {open ? (
        <div className="mega-menu">
          <div><strong>Seviyeye Göre</strong><Link href="/courses">A1 Başlangıç</Link><Link href="/courses">A2 Temel</Link><Link href="/courses">B1 Orta</Link><Link href="/courses">B2 Orta-İleri</Link></div>
          <div><strong>Beceriye Göre</strong><Link href="/courses">Gramer</Link><Link href="/vocabulary">Kelime</Link><Link href="/writing">Yazma</Link><Link href="/courses">Dinleme</Link></div>
          <div><strong>Sınava Göre</strong><Link href="/exams">TestDaF</Link><Link href="/exams">TELC</Link><Link href="/exams">Goethe-Zertifikat</Link><Link href="/exams">Üniversite Hazırlık</Link></div>
          <div><strong>Hedefe Göre</strong><Link href="/courses">Günlük Almanca</Link><Link href="/courses">Akademik Almanca</Link><Link href="/courses">İş Almancası</Link><Link href="/courses">Almanya'da Yaşam</Link></div>
        </div>
      ) : null}
    </header>
  );
}
