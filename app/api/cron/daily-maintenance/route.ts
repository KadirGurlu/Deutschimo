import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLogicalBackup } from "@/lib/backup/backup-service";
import { logSystemError } from "@/lib/security/logging";

export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  try {
    const backup = await createLogicalBackup();
    const cleanup = await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
      prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } }),
      prisma.rateLimitEvent.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } }),
      prisma.apiFailureLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
      prisma.systemErrorLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
    ]);
    return NextResponse.json({ ok: backup.status === "COMPLETED", backup: { id: backup.id, status: backup.status, error: backup.errorMessage }, cleanup: cleanup.map((item) => item.count) });
  } catch (error) {
    await logSystemError({ source: "daily-maintenance", error, route: "/api/cron/daily-maintenance", method: "GET" });
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  }
}
