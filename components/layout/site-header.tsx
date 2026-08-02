"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { clearCurrentLearningCache, setActiveLearningUser } from "@/lib/storage/learning-storage";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";
  const brandHref = authenticated ? "/dashboard" : "/";

  async function logout() {
    if (loggingOut || !window.confirm("Çıkış yapmak istediğinden emin misin?")) return;
    setLoggingOut(true);
    clearCurrentLearningCache();
    setActiveLearningUser(null);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="site-header v19-site-header v20-site-header v26-site-header">
      <div className="header-inner">
        <Link href={brandHref} className="brand" aria-label={authenticated ? "Öğrenci Paneline git" : "Deutschimo ana sayfa"} onClick={() => setOpen(false)}>
          <Image src="/deutschimo-logo.png" alt="Deutschimo" width={40} height={40} className="brand-logo" priority />
          <span>Deutschimo</span>
        </Link>

        <div className="header-actions">
          {authenticated ? <>
            <Link href="/profile" className="login-link v19-account-link v26-account-link">
              <UserRound size={18} /> {session.user.firstName ?? session.user.name ?? "Hesabım"}
            </Link>
            <button className="v26-logout-button" aria-label="Çıkış yap" title="Çıkış yap" onClick={logout} disabled={loggingOut}>
              <LogOut size={19} /><span>{loggingOut ? "Çıkılıyor" : "Çıkış Yap"}</span>
            </button>
          </> : <>
            <Link href="/auth?mode=login" className="login-link">Giriş Yap</Link>
            <Link href="/auth?mode=register" className="button button-primary header-cta">Kayıt Ol</Link>
          </>}

          <button
            className="icon-button mobile-only"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="v19-mobile-menu v20-mobile-menu" aria-label="Hesap menüsü">
          {authenticated ? <>
            <Link href="/dashboard" onClick={() => setOpen(false)}>Öğrenci Paneli</Link>
            <Link href="/courses" onClick={() => setOpen(false)}>Kurslar</Link>
            <button className="v26-mobile-logout" onClick={logout} disabled={loggingOut}><LogOut size={18}/> Çıkış Yap</button>
          </> : <>
            <Link href="/auth?mode=login" onClick={() => setOpen(false)}>Giriş Yap</Link>
            <Link href="/auth?mode=register" className="button button-primary" onClick={() => setOpen(false)}>Kayıt Ol</Link>
          </>}
        </nav>
      ) : null}
    </header>
  );
}
