import { AccessibilityRuntime } from "@/components/accessibility/accessibility-runtime";
import { WebVitalsDevReporter } from "@/components/performance/web-vitals-dev";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "./providers";

import { NetworkStatus } from "@/components/platform/network-status";
export const metadata: Metadata = {
  title: "Deutschimo | Sistemli Almanca Öğren",
  description: "A1'den B2'ye akademik ve ölçülebilir Almanca öğrenme platformu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <AccessibilityRuntime />
        <WebVitalsDevReporter />
        <Providers>
          <SiteHeader />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <MobileNav />
        </Providers>
              <NetworkStatus />
</body>
    </html>
  );
}
