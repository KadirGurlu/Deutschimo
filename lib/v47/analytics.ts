import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { isProductEventName, type ProductEventName } from "@/lib/v47/events";
import { log } from "@/lib/v47/logger";
import { releaseInfo } from "@/lib/v47/release";
import { redactForLog } from "@/lib/v47/redact";

function hashSession(value?: string | null) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export async function analyticsConsentEnabled(userId: string) {
  const consent = await prisma.userConsent.findUnique({
    where: { userId },
    select: { analyticsEnabled: true },
  });
  return consent?.analyticsEnabled === true;
}

export async function trackProductEvent(input: {
  event: ProductEventName;
  userId?: string | null;
  sessionKey?: string | null;
  route?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
}) {
  if (!isProductEventName(input.event)) throw new Error("invalid_product_event");
  if (process.env.V47_ANALYTICS_ENABLED !== "true") {
    return { stored: false as const, reason: "disabled" as const };
  }

  if (input.userId && !(await analyticsConsentEnabled(input.userId))) {
    return { stored: false as const, reason: "no_consent" as const };
  }

  const release = releaseInfo();
  const safeMetadata = redactForLog(input.metadata ?? {}) as Record<string, unknown>;

  try {
    const record = await prisma.productAnalyticsEvent.create({
      data: {
        event: input.event,
        userId: input.userId ?? null,
        sessionKey: hashSession(input.sessionKey),
        route: input.route?.slice(0, 300) ?? null,
        requestId: input.requestId?.slice(0, 100) ?? randomUUID(),
        environment: release.environment,
        release: release.release,
        durationMs: input.durationMs ?? null,
        metadata: safeMetadata,
        dedupeKey: input.dedupeKey ?? null,
      },
      select: { id: true, occurredAt: true },
    });

    log.info({
      event: "product_analytics_event",
      operation: input.event,
      result: "success",
      userId: input.userId ?? null,
      requestId: input.requestId ?? undefined,
    });
    return { stored: true as const, id: record.id, occurredAt: record.occurredAt };
  } catch (error) {
    const duplicate =
      error instanceof Error &&
      /unique|duplicate/i.test(error.message) &&
      Boolean(input.dedupeKey);
    if (duplicate) return { stored: false as const, reason: "duplicate" as const };
    log.error({
      event: "product_analytics_event_failed",
      operation: input.event,
      result: "failure",
      userId: input.userId ?? null,
      requestId: input.requestId ?? undefined,
      errorCategory: "analytics_storage",
      metadata: { error },
    });
    throw error;
  }
}
