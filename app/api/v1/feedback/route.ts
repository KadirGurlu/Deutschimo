import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/v47/api";
import { trackProductEvent } from "@/lib/v47/analytics";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["BUG", "SUGGESTION", "CONTENT_ERROR", "OTHER"]);

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!userId) return apiError("UNAUTHENTICATED", "Authentication required.", { status: 401, requestId });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError("INVALID_BODY", "Invalid feedback payload.", { status: 422, requestId });
  }
  const value = body as Record<string, unknown>;
  const category = typeof value.category === "string" ? value.category : "";
  const comment = typeof value.comment === "string" ? value.comment.trim() : "";
  if (!CATEGORIES.has(category)) {
    return apiError("INVALID_CATEGORY", "Unknown feedback category.", { status: 422, requestId });
  }
  if (comment.length < 3 || comment.length > 4000) {
    return apiError("INVALID_COMMENT", "Feedback must be between 3 and 4000 characters.", { status: 422, requestId });
  }

  const record = await prisma.userFeedback.create({
    data: {
      userId,
      category,
      comment,
      route: typeof value.route === "string" ? value.route.slice(0, 300) : null,
      resourceType: typeof value.resourceType === "string" ? value.resourceType.slice(0, 80) : null,
      resourceId: typeof value.resourceId === "string" ? value.resourceId.slice(0, 160) : null,
      appVersion: typeof value.appVersion === "string" ? value.appVersion.slice(0, 80) : null,
    },
    select: { id: true, createdAt: true },
  });

  await trackProductEvent({
    event: "feedback_submitted",
    userId,
    route: typeof value.route === "string" ? value.route : null,
    requestId,
    metadata: { category },
    dedupeKey: `feedback:${record.id}`,
  }).catch(() => undefined);

  return apiOk({ id: record.id, createdAt: record.createdAt }, { status: 201, requestId });
}
