"use client";

import { SessionProvider } from "next-auth/react";
import { LearningSyncBridge } from "@/components/auth/learning-sync-bridge";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider><LearningSyncBridge/>{children}</SessionProvider>;
}
