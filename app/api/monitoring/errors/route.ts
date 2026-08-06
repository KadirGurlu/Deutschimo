import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";
import { logSystemError } from "@/lib/security/logging";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, requestSecurityContext } from "@/lib/security/request";

const allowedDomains = new Set(["AUTH", "API", "UI", "DATABASE", "RELEASE", "UNKNOWN"]);
function safeToken(value: unknown, fallback: string) {
  const candidate = String(value || fallback).toUpperCase().replace(/[^A-Z0-9_-]+/g, "-").slice(0, 40);
  return candidate || fallback;
}

async function POSTHandler(request: Request) {
  const ip = getClientIp(request);
  const limited = await consumeRateLimit({ scope: "client-error-report", key: ip, limit: 30, windowSeconds: 3600 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Hata raporu sınırı aşıldı." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const body = await request.json() as {
    code?: string;
    domain?: string;
    operation?: string;
    message?: string;
    stack?: string;
    route?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  };
  if (!body.message) return NextResponse.json({ error: "Mesaj zorunludur." }, { status: 400 });

  const code = /^[A-Z0-9]+(?:-[A-Z0-9]+){2,}$/.test(body.code || "") ? body.code : undefined;
  const requestedDomain = safeToken(body.domain, "UI");
  const domain = allowedDomains.has(requestedDomain) ? requestedDomain : "UNKNOWN";
  const operation = safeToken(body.operation, "GENERAL").slice(0, 80);
  const context = requestSecurityContext(request);
  const metadata = {
    ...(body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {}),
    errorCode: code,
    operation,
    userAgent: String(body.userAgent || "").slice(0, 500),
  };
  const error = new Error(String(body.message).slice(0, 1000));
  error.stack = String(body.stack || error.stack || "").slice(0, 4000);
  const result = await logSystemError({
    source: domain,
    operation,
    error,
    route: String(body.route || "").slice(0, 500),
    errorCode: code,
    requestId: context.requestId,
    ipHash: context.ipHash,
    metadata: metadata as Prisma.InputJsonValue,
  });
  return NextResponse.json({ ok: true, errorCode: result.errorCode }, { status: 202 });
}

async function GETHandler() {
  const user = await getApiUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
  const [systemErrors, apiFailures] = await Promise.all([
    prisma.systemErrorLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.apiFailureLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return NextResponse.json({ systemErrors, apiFailures, generatedAt: new Date().toISOString() });
}

export const POST = withApiMonitoring("/api/monitoring/errors", POSTHandler, { maxBodyBytes: 64 * 1024 });
export const GET = withApiMonitoring("/api/monitoring/errors", GETHandler);
