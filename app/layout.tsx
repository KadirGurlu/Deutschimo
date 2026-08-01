import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/app/providers";
import { CookieBanner } from "@/components/security/cookie-banner";

export const metadata: Metadata = {
  title: "Deutschimo | Sistemli Almanca Öğren",
  description: "A1'den B2'ye dersler, öğrenme zekâsı ve dört beceri laboratuvarıyla ölçülebilir Almanca öğrenme platformu."
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
