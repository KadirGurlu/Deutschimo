const SECRET_KEY = /(password|passwd|secret|token|authorization|cookie|api[-_]?key|database.*url|connection.*string|credential)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const URL_CREDENTIALS = /(postgres(?:ql)?:\/\/)[^@\s]+@/gi;

function sanitizeString(value: string): string {
  return value
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(URL_CREDENTIALS, "$1[REDACTED]@")
    .replace(EMAIL, "[EMAIL_REDACTED]")
    .slice(0, 4000);
}

export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MAX_DEPTH]";
  if (value == null) return value;
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactForLog(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[REDACTED]" : redactForLog(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function hasForbiddenLogKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.keys(value as Record<string, unknown>).some((key) => SECRET_KEY.test(key));
}
