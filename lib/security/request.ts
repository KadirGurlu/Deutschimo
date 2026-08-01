import { createHmac, randomUUID } from "node:crypto";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function securityHash(value: string) {
  const key = process.env.SECURITY_HASH_KEY || process.env.AUTH_SECRET || "development-only-key";
  return createHmac("sha256", key).update(value).digest("hex");
}

export function requestSecurityContext(request: Request) {
  return {
    requestId: request.headers.get("x-request-id") || randomUUID(),
    ipHash: securityHash(getClientIp(request)),
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}
