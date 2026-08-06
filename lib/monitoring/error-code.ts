export type ErrorDomain = "AUTH" | "API" | "UI" | "DATABASE" | "RELEASE" | "UNKNOWN";
function token(value: string, fallback: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 16);
  return clean || fallback;
}
function stableNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String(Math.abs(hash) % 10_000).padStart(4, "0");
}
export function createErrorCode(domain: ErrorDomain | string, operation: string, supplied?: string) {
  if (supplied && /^[A-Z0-9]+(?:-[A-Z0-9]+){2,}$/.test(supplied)) return supplied;
  const normalizedDomain = token(domain, "UNKNOWN");
  const normalizedOperation = token(operation, "GENERAL");
  return `${normalizedDomain}-${normalizedOperation}-${stableNumber(`${normalizedDomain}:${normalizedOperation}:${supplied || "unspecified"}`)}`;
}
