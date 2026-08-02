import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/app/providers";
import { CookieBanner } from "@/components/security/cookie-banner";

export const metadata: Metadata = {
  title: "Deutschimo | Almanca Öğrenmenin Sade Yolu",
  description: "A1'den B2'ye yapılandırılmış dersler, özgün alıştırmalar ve ilerleme takibiyle sade Almanca öğrenme platformu.",
  icons: {
    icon: "/deutschimo-logo.png",
    apple: "/deutschimo-apple-icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <SiteHeader />
          <main>{children}</main>
          <MobileNav />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
