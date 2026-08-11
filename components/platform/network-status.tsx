"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./network-status.module.css";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [restored, setRestored] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);

    const offline = () => {
      if (timer.current) clearTimeout(timer.current);
      setRestored(false);
      setOnline(false);
    };
    const onlineAgain = () => {
      setOnline(true);
      setRestored(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setRestored(false), 3500);
    };

    window.addEventListener("offline", offline);
    window.addEventListener("online", onlineAgain);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", onlineAgain);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (online && !restored) return null;

  return (
    <div
      className={online ? styles.restored : styles.offline}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {online
        ? "Bağlantı yeniden kuruldu."
        : "İnternet bağlantısı yok. Bağlantı geldiğinde tekrar deneyebilirsin."}
    </div>
  );
}
