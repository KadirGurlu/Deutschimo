import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { apiFailure } from "@/lib/platform/response";

export type UserRateLimitOptions = {
  scope: string;
  userId: string;
  limit: number;
  windowSeconds: number;
};

export async function enforceUserRateLimit(request: Request, options: UserRateLimitOptions) {
  const result = await consumeRateLimit({
    scope: options.scope,
    key: `${options.userId}:${getClientIp(request)}`,
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  if (result.allowed) return null;
  return apiFailure(request, 429, "RATE_LIMITED", "Çok fazla istek gönderildi. Lütfen kısa bir süre sonra yeniden dene.", {
    details: { retryAfterSeconds: result.retryAfterSeconds },
    headers: { "Retry-After": String(result.retryAfterSeconds) },
  });
}
