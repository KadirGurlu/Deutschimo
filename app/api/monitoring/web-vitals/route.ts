import { NextResponse } from "next/server";
import { withApiMonitoring } from "@/lib/security/api-monitor";

const allowedMetrics = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);
const allowedRatings = new Set(["good", "needs-improvement", "poor", "unknown"]);

function safeRoute(value: unknown) {
  const raw = String(value || "/").split("?")[0].split("#")[0].slice(0, 300);
  return raw.startsWith("/") ? raw : "/";
}

async function POSTHandler(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const name = String(body.name || "").toUpperCase();
  const value = Number(body.value);

  if (!allowedMetrics.has(name) || !Number.isFinite(value) || value < 0) {
    return NextResponse.json({ error: "Geçersiz performans metriği." }, { status: 400 });
  }

  const requestedRating = String(body.rating || "unknown").toLowerCase();
  const rating = allowedRatings.has(requestedRating) ? requestedRating : "unknown";
  const route = safeRoute(body.route);
  const navigationType = String(body.navigationType || "unknown")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 40);

  // V46.11 observability contract:
  // request + operation + result + errorCategory only; no user/session/secret/body dump.
  console.info(
    "[DEUTSCHIMO_WEB_VITAL]",
    JSON.stringify({
      request: route,
      operation: name,
      result: rating,
      errorCategory: null,
      value: Number(value.toFixed(name === "CLS" ? 4 : 1)),
      navigationType,
    }),
  );

  return NextResponse.json({ accepted: true }, { status: 202 });
}

export const POST = withApiMonitoring(
  "/api/monitoring/web-vitals",
  POSTHandler,
  { maxBodyBytes: 8 * 1024 },
);
