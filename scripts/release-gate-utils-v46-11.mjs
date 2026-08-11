export const CORE_WEB_VITALS = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "score" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

export function classifyVital(name, value) {
  const rule = CORE_WEB_VITALS[name];
  if (!rule || !Number.isFinite(value) || value < 0) return "UNKNOWN";
  if (value <= rule.good) return "GOOD";
  if (value <= rule.poor) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

const secretPattern =
  /(?:password|passcode|secret|token|authorization|cookie|session|credential|database[_-]?url|api[_-]?key)/i;

export function sanitizeLogObject(input, depth = 0) {
  if (input === null || input === undefined) return input;
  if (depth > 3) return "[truncated]";
  if (typeof input === "number" || typeof input === "boolean") return input;
  if (typeof input === "string") {
    return input
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
      .slice(0, 500);
  }
  if (Array.isArray(input)) return input.slice(0, 20).map((item) => sanitizeLogObject(item, depth + 1));
  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input)
        .slice(0, 40)
        .map(([key, value]) => [
          key.slice(0, 80),
          secretPattern.test(key) ? "[redacted]" : sanitizeLogObject(value, depth + 1),
        ]),
    );
  }
  return String(input).slice(0, 200);
}
