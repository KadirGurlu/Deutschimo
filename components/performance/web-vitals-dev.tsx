"use client";

import { useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";

const supported = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);

function safeRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.slice(0, 300) || "/";
}

export function WebVitalsDevReporter() {
  const reported = useRef(new Set<string>());

  useReportWebVitals((metric) => {
    if (!supported.has(metric.name)) return;

    const dedupeKey = `${metric.id}:${metric.name}`;
    if (reported.current.has(dedupeKey)) return;
    reported.current.add(dedupeKey);

    const payload = {
      name: metric.name,
      value: Number(metric.value),
      rating: "rating" in metric ? String(metric.rating ?? "unknown") : "unknown",
      id: String(metric.id || "").slice(0, 120),
      route: safeRoute(),
      navigationType:
        "navigationType" in metric ? String(metric.navigationType ?? "unknown").slice(0, 40) : "unknown",
    };

    if (process.env.NODE_ENV !== "production") {
      console.info("[Deutschimo V46.11 Web Vital]", payload);
      return;
    }

    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/monitoring/web-vitals",
          new Blob([body], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/monitoring/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    } catch {
      // Performance telemetry must never affect the learning flow.
    }
  });

  return null;
}
