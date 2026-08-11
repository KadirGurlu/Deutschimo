import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/v47/api";
import { isProductEventName } from "@/lib/v47/events";
import { trackProductEvent } from "@/lib/v47/analytics";

export const dynamic = "force-dynamic";

function objectBody(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 16_384) {
    return apiError("PAYLOAD_TOO_LARGE", "Analytics payload is too large.", { status: 413, requestId });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Invalid JSON body.", { status: 400, requestId });
  }
  if (!objectBody(body) || !isProductEventName(body.event)) {
    return apiError("INVALID_EVENT", "Unknown analytics event.", { status: 422, requestId });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const metadata = objectBody(body.metadata) ? body.metadata : undefined;

  const result = await trackProductEvent({
    event: body.event,
    userId,
    route: typeof body.route === "string" ? body.route : null,
    sessionKey: request.headers.get("x-deutschimo-session"),
    requestId,
    durationMs: typeof body.durationMs === "number" ? Math.max(0, Math.round(body.durationMs)) : null,
    metadata,
    dedupeKey: typeof body.dedupeKey === "string" ? body.dedupeKey.slice(0, 160) : null,
  });

  return apiOk(result, { status: result.stored ? 202 : 200, requestId });
}
