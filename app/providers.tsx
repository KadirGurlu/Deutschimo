"use client";
import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "@/components/monitoring/error-boundary";
export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider><ErrorBoundary>{children}</ErrorBoundary></SessionProvider>;
}
