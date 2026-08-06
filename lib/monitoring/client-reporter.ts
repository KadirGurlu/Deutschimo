import { createErrorCode, type ErrorDomain } from "@/lib/monitoring/error-code";

type ClientErrorInput = {
  domain?: ErrorDomain | string;
  operation?: string;
  code?: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
};

const sensitiveKey = /(?:password|passcode|secret|token|authorization|cookie|session|credential|database[_-]?url|api[_-]?key)/i;
function redactText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/([?&](?:token|code|password|secret|key|auth)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\b(password|passcode|secret|token|authorization|cookie|session|credential|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, maxLength);
}
function safeMetadata(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 3) return "[truncated]";
  if (typeof value === "string") return redactText(value, 1000);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => safeMetadata(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 40).map(([key, item]) => [
        key.slice(0, 80),
        sensitiveKey.test(key) ? "[redacted]" : safeMetadata(item, depth + 1),
      ]),
    );
  }
  return redactText(value, 300);
}

export async function reportClientError(input: ClientErrorInput) {
  const code = createErrorCode(input.domain || "UI", input.operation || "GENERAL", input.code);
  if (typeof window === "undefined") return code;
  try {
    await fetch("/api/monitoring/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        code,
        domain: input.domain || "UI",
        operation: input.operation || "GENERAL",
        message: redactText(input.message, 1000),
        stack: input.stack ? redactText(input.stack, 4000) : undefined,
        route: window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 500),
        metadata: safeMetadata(input.metadata),
      }),
    });
  } catch {
    // Monitoring must never break the user flow.
  }
  return code;
}
