"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, LoaderCircle } from "lucide-react";
import { SYNC_STATUS_EVENT, type SyncStatus } from "@/components/auth/learning-sync-bridge";

const labels: Record<SyncStatus, string> = {
  idle: "",
  loading: "İlerleme yükleniyor",
  saving: "Kaydediliyor",
  saved: "İlerleme kaydedildi",
  offline: "Çevrimdışı — cihazda saklanıyor",
  error: "Senkronizasyon bekliyor",
};

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  useEffect(() => {
    const listener = (event: Event) => setStatus((event as CustomEvent<SyncStatus>).detail);
    window.addEventListener(SYNC_STATUS_EVENT, listener);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, listener);
  }, []);
  if (status === "idle") return null;
  return <span className={`sync-status sync-${status}`} aria-live="polite">{status === "loading" || status === "saving" ? <LoaderCircle size={14} className="spin"/> : status === "saved" ? <CheckCircle2 size={14}/> : <CloudOff size={14}/>} {labels[status]}</span>;
}
