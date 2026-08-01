import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function safeMessage(error: unknown) { return error instanceof Error ? error.message.slice(0, 4000) : String(error).slice(0, 4000); }
function safeStack(error: unknown) { return error instanceof Error ? error.stack?.slice(0, 16000) : undefined; }
function fingerprint(source: string, message: string) { return createHash("sha256").update(`${source}:${message}`).digest("hex"); }

export async function logSystemError(input: { source: string; error: unknown; route?: string; method?: string; digest?: string; requestId?: string; ipHash?: string; metadata?: unknown }) {
  const message = safeMessage(input.error);
  try {
    await prisma.systemErrorLog.create({ data: { source: input.source, route: input.route, method: input.method, message,
      stack: safeStack(input.error), digest: input.digest, fingerprint: fingerprint(input.source, message), requestId: input.requestId,
      ipHash: input.ipHash, metadata: input.metadata as Prisma.InputJsonValue | undefined }});
  } catch (loggingError) { console.error("system_error_log_failed", loggingError, input.error); }
}

export async function logApiFailure(input: { route: string; method: string; statusCode: number; requestId?: string; ipHash?: string; userAgent?: string | null; message?: string }) {
  try { await prisma.apiFailureLog.create({ data: { ...input, userAgent: input.userAgent?.slice(0, 500) ?? null, message: input.message?.slice(0, 1000) } }); }
  catch (error) { console.error("api_failure_log_failed", error); }
}
