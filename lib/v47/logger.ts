import { randomUUID } from "node:crypto";
import { redactForLog } from "@/lib/v47/redact";
import { releaseInfo } from "@/lib/v47/release";

type Level = "debug" | "info" | "warn" | "error";

export type LogContext = {
  event: string;
  operation?: string;
  result?: "success" | "failure" | "denied" | "skipped";
  route?: string;
  requestId?: string;
  userId?: string | null;
  durationMs?: number;
  errorCategory?: string;
  metadata?: Record<string, unknown>;
};

function shouldLog(level: Level) {
  const configured = (process.env.V47_LOG_LEVEL ?? "info").toLowerCase();
  const rank: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  return rank[level] >= (rank[configured as Level] ?? 20);
}

function emit(level: Level, context: LogContext) {
  if (!shouldLog(level)) return;
  const release = releaseInfo();
  const payload = redactForLog({
    ts: new Date().toISOString(),
    level,
    service: "deutschimo",
    environment: release.environment,
    release: release.release,
    commit: release.commit,
    requestId: context.requestId ?? randomUUID(),
    ...context,
  });
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (context: LogContext) => emit("debug", context),
  info: (context: LogContext) => emit("info", context),
  warn: (context: LogContext) => emit("warn", context),
  error: (context: LogContext) => emit("error", context),
};
