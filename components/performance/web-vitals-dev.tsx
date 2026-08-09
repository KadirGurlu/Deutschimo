"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsDevReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[Deutschimo V45 Web Vital]", {
        name: metric.name,
        value: metric.value,
        rating: "rating" in metric ? metric.rating : undefined,
        id: metric.id,
      });
    }
  });

  return null;
}
