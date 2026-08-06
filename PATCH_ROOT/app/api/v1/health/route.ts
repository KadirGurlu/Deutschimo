import { prisma } from "@/lib/db";
import { apiFailure, apiSuccess } from "@/lib/platform/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { safeSecretEqual } from "@/lib/security/secrets";
import { withApiMonitoring } from "@/lib/security/api-monitor";

export const runtime = "nodejs";

async function GETHandler(request: Request) {
  const limit = await consumeRateLimit({
    scope: "v31-health",
    key: getClientIp(request),
    limit: 30,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return apiFailure(request, 429, "RATE_LIMITED", "Sağlık kontrolü geçici olarak sınırlandı.", {
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  if (!deep) {
    return apiSuccess(request, {
      status: "ok",
      checks: { application: "ok" },
    }, { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" } });
  }

  const expected = process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET;
  const provided = request.headers.get("x-health-secret") || request.headers.get("authorization");
  const authorized = Boolean(
    expected && (
      safeSecretEqual(provided, expected) ||
      safeSecretEqual(provided, `Bearer ${expected}`)
    ),
  );
  if (!authorized) return apiFailure(request, 403, "FORBIDDEN", "Derin sağlık kontrolü için yetki gerekli.");

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database health check timeout")), 2_500)),
    ]);
    return apiSuccess(request, {
      status: "ok",
      checks: { application: "ok", database: "ok" },
    });
  } catch {
    return apiFailure(request, 503, "SERVICE_UNAVAILABLE", "Veritabanı sağlık kontrolü başarısız.");
  }
}

export const GET = withApiMonitoring("/api/v1/health", GETHandler);
