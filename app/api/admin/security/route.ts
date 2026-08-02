import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";

async function GETHandler() {
  const user = await getApiUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [errors, failures, blocked, backups, testUsers, databaseLatency] = await Promise.all([
    prisma.systemErrorLog.count({ where: { createdAt: { gte: day } } }),
    prisma.apiFailureLog.count({ where: { createdAt: { gte: day } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: day } } }),
    prisma.databaseBackup.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.user.count({ where: { isTestUser: true } }),
    (async () => {
      const started = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      return Math.max(0, Math.round(performance.now() - started));
    })(),
  ]);

  const blobConfigured = Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
  return NextResponse.json({
    version: "24.0.0",
    errors,
    failures,
    blocked,
    backups,
    testUsers,
    databaseLatency,
    backupConfigured: Boolean(blobConfigured && process.env.BACKUP_ENCRYPTION_KEY),
    configuration: {
      authSecret: Boolean(process.env.AUTH_SECRET),
      securityHashKey: Boolean(process.env.SECURITY_HASH_KEY),
      cronSecret: Boolean(process.env.CRON_SECRET),
      googleAuth: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true" || Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      emailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== "true" || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    },
  });
}

export const GET = withApiMonitoring("/api/admin/security", GETHandler);
