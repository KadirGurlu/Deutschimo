import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLogicalBackup, pruneExpiredBackups } from "@/lib/backup/backup-service";
import { runPlatformMaintenance } from "@/lib/platform/maintenance";
import { logSystemError } from "@/lib/security/logging";
import { safeSecretEqual } from "@/lib/security/secrets";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || !safeSecretEqual(request.headers.get("authorization"), `Bearer ${expected}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
    const backup = await createLogicalBackup();
    const prunedBackups = await pruneExpiredBackups().catch(() => 0);
    const [tokens, platformCleanup, failedBackups] = await Promise.all([
      prisma.$transaction([
        prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
      ]),
      runPlatformMaintenance(),
      prisma.databaseBackup.deleteMany({ where: { status: "FAILED", startedAt: { lt: ninetyDaysAgo } } }),
    ]);

    return NextResponse.json({
      ok: backup.status === "COMPLETED",
      backup: { id: backup.id, status: backup.status, error: backup.errorMessage },
      prunedBackups,
      cleanup: {
        emailVerificationTokensDeleted: tokens[0].count,
        passwordResetTokensDeleted: tokens[1].count,
        failedBackupsDeleted: failedBackups.count,
        ...platformCleanup,
      },
    }, {
      headers: {
        "Cache-Control": "no-store",
        "x-request-id": request.headers.get("x-request-id") ?? "maintenance",
      },
    });
  } catch (error) {
    await logSystemError({
      source: "daily-maintenance",
      error,
      route: "/api/cron/daily-maintenance",
      method: "GET",
      requestId: request.headers.get("x-request-id") ?? undefined,
    });
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  }
}
