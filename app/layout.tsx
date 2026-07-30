import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export const metadata: Metadata = {
  title: "Deutschimo | Sistemli Almanca Öğren",
  description: "A1'den B2'ye akademik ve ölçülebilir Almanca öğrenme platformu."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
