import { createHmac, randomUUID } from "node:crypto";

function secretHashKey() {
  const key = process.env.SECURITY_HASH_KEY || process.env.AUTH_SECRET;
  if (key) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SECURITY_HASH_KEY or AUTH_SECRET must be configured in production.");
  }
  return "development-only-key-not-for-production";
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return candidate.slice(0, 128);
}

export function securityHash(value: string) {
  return createHmac("sha256", secretHashKey()).update(value).digest("hex");
}

function safeRequestId(value: string | null) {
  const candidate = value?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

export function requestSecurityContext(request: Request) {
  return {
    requestId: safeRequestId(request.headers.get("x-request-id")),
    ipHash: securityHash(getClientIp(request)),
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}
