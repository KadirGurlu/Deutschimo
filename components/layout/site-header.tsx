"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
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
    <header className="site-header v19-site-header v20-site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Deutschimo ana sayfa" onClick={() => setOpen(false)}>
          <Image src="/deutschimo-logo.png" alt="" width={40} height={40} className="brand-logo" priority /><span>Deutschimo</span>
        </Link>

        <div className="header-actions">
          {authenticated ? <>
            <SyncStatusIndicator />
            <Link href="/dashboard" className="login-link v19-account-link">
              <UserRound size={18} /> {session.user.firstName ?? session.user.name ?? "Hesabım"}
            </Link>
            <button className="icon-button" aria-label="Çıkış yap" title="Çıkış yap" onClick={logout}><LogOut size={19} /></button>
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
          {authenticated ? (
            <Link href="/dashboard" onClick={() => setOpen(false)}>Hesabım</Link>
          ) : <>
            <Link href="/auth?mode=login" onClick={() => setOpen(false)}>Giriş Yap</Link>
            <Link href="/auth?mode=register" className="button button-primary" onClick={() => setOpen(false)}>Kayıt Ol</Link>
          </>}
        </nav>
      ) : null}
    </header>
  );
}
