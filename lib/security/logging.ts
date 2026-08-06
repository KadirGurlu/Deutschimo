import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const sensitiveKey = /(?:password|passcode|secret|token|authorization|cookie|session|credential|database[_-]?url|api[_-]?key)/i;

function redactText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s/]+@/gi, "$1[redacted]@")
    .replace(/([?&](?:token|code|password|secret|key|auth)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\b(password|passcode|secret|token|authorization|cookie|session|credential|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, maxLength);
}

function redactMetadata(value: unknown, depth = 0): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") return redactText(value, 2000);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => redactMetadata(item, depth + 1) ?? null);
  if (typeof value === "object") {
    const safe: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      safe[key.slice(0, 80)] = sensitiveKey.test(key) ? "[redacted]" : (redactMetadata(item, depth + 1) ?? null);
    }
    return safe;
  }
  return redactText(value, 500);
}

function safeMessage(error: unknown) {
  return redactText(error instanceof Error ? error.message : error, 4000);
}
function safeStack(error: unknown) {
  return error instanceof Error && error.stack ? redactText(error.stack, 16000) : undefined;
}
function fingerprint(source: string, message: string) {
  return createHash("sha256").update(`${source}:${message}`).digest("hex");
}
function codeToken(value: string, fallback: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 16);
  return clean || fallback;
}

export function serverErrorCode(source: string, operation = "GENERAL", requestId?: string) {
  const seed = createHash("sha256").update(`${source}:${operation}:${requestId || Date.now()}`).digest("hex");
  return `${codeToken(source, "SERVER")}-${codeToken(operation, "GENERAL")}-${String(parseInt(seed.slice(0, 6), 16) % 10000).padStart(4, "0")}`;
}

export async function logSystemError(input: {
  source: string;
  error: unknown;
  route?: string;
  method?: string;
  digest?: string;
  requestId?: string;
  ipHash?: string;
  metadata?: unknown;
  errorCode?: string;
  operation?: string;
}) {
  const source = redactText(input.source, 80) || "UNKNOWN";
  const operation = redactText(input.operation || input.method || "GENERAL", 80) || "GENERAL";
  const message = safeMessage(input.error);
  const errorCode = input.errorCode || serverErrorCode(source, operation, input.requestId);
  const fp = fingerprint(source, message);
  const suppliedMetadata = redactMetadata(input.metadata);
  const metadata = {
    ...(suppliedMetadata && typeof suppliedMetadata === "object" && !Array.isArray(suppliedMetadata) ? suppliedMetadata : {}),
    errorCode,
    operation,
    privacyFiltered: true,
  } as Prisma.InputJsonValue;
  try {
    await prisma.systemErrorLog.create({
      data: {
        source,
        route: input.route ? redactText(input.route.split("?")[0], 500) : undefined,
        method: input.method ? redactText(input.method, 20) : undefined,
        message,
        stack: safeStack(input.error),
        digest: input.digest ? redactText(input.digest, 200) : undefined,
        fingerprint: fp,
        requestId: input.requestId ? redactText(input.requestId, 128) : undefined,
        ipHash: input.ipHash ? redactText(input.ipHash, 128) : undefined,
        metadata,
      },
    });
  } catch (loggingError) {
    console.error("system_error_log_failed", loggingError, errorCode);
  }
  return { errorCode, fingerprint: fp };
}

export async function logApiFailure(input: {
  route: string;
  method: string;
  statusCode: number;
  requestId?: string;
  ipHash?: string;
  userAgent?: string | null;
  message?: string;
}) {
  try {
    await prisma.apiFailureLog.create({
      data: {
        route: redactText(input.route.split("?")[0], 500),
        method: redactText(input.method, 20),
        statusCode: input.statusCode,
        requestId: input.requestId ? redactText(input.requestId, 128) : undefined,
        ipHash: input.ipHash ? redactText(input.ipHash, 128) : undefined,
        userAgent: input.userAgent ? redactText(input.userAgent, 500) : null,
        message: input.message ? redactText(input.message, 1000) : undefined,
      },
    });
  } catch (error) {
    console.error("api_failure_log_failed", error);
  }
}
