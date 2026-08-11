import { createHash, randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/v47/api";
import { log } from "@/lib/v47/logger";

export const dynamic = "force-dynamic";

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function currentUserId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return apiError("UNAUTHENTICATED", "Authentication required.", { status: 401 });

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  await prisma.accountDeletionRequest.upsert({
    where: { userId },
    update: { tokenHash: hashToken(token), expiresAt, status: "PENDING", requestedAt: new Date() },
    create: { userId, tokenHash: hashToken(token), expiresAt, status: "PENDING" },
  });

  return apiOk({
    confirmationToken: token,
    expiresAt,
    confirmationPhrase: "DELETE_MY_ACCOUNT",
    enabled: process.env.V47_ACCOUNT_DELETION_ENABLED === "true",
  });
}

export async function DELETE(request: Request) {
  if (process.env.V47_ACCOUNT_DELETION_ENABLED !== "true") {
    return apiError(
      "ACCOUNT_DELETION_NOT_ENABLED",
      "Account deletion is disabled until legal retention and cascade review is approved.",
      { status: 503 },
    );
  }

  const userId = await currentUserId();
  if (!userId) return apiError("UNAUTHENTICATED", "Authentication required.", { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError("INVALID_BODY", "Invalid deletion payload.", { status: 422 });
  }
  const value = body as Record<string, unknown>;
  if (value.confirmation !== "DELETE_MY_ACCOUNT" || typeof value.token !== "string") {
    return apiError("CONFIRMATION_REQUIRED", "Account deletion confirmation failed.", { status: 422 });
  }

  const pending = await prisma.accountDeletionRequest.findUnique({ where: { userId } });
  if (
    !pending ||
    pending.status !== "PENDING" ||
    pending.expiresAt.getTime() < Date.now() ||
    pending.tokenHash !== hashToken(value.token)
  ) {
    return apiError("INVALID_CONFIRMATION_TOKEN", "Deletion token is invalid or expired.", { status: 422 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.accountDeletionRequest.delete({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    log.info({
      event: "account_deleted",
      operation: "delete_account",
      result: "success",
      userId,
    });
    return apiOk({ deleted: true });
  } catch (error) {
    log.error({
      event: "account_deletion_failed",
      operation: "delete_account",
      result: "failure",
      userId,
      errorCategory: "database_integrity",
      metadata: { error },
    });
    return apiError(
      "ACCOUNT_DELETION_BLOCKED",
      "Deletion was rolled back. Related-data integrity requires review.",
      { status: 409 },
    );
  }
}
