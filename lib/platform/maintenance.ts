import { prisma } from "@/lib/db";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export async function runPlatformMaintenance() {
  const now = new Date();
  const [
    idempotency,
    rateLimits,
    sessionRevocations,
    loginAttempts,
    apiFailures,
    systemErrors,
    auditLogs,
    revokedDevices,
  ] = await prisma.$transaction([
    prisma.apiIdempotencyRecord.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimitEvent.deleteMany({ where: { scope: { not: "session-revocation" }, createdAt: { lt: daysAgo(2) } } }),
    prisma.rateLimitEvent.deleteMany({ where: { scope: "session-revocation", createdAt: { lt: daysAgo(35) } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: daysAgo(90) } } }),
    prisma.apiFailureLog.deleteMany({ where: { createdAt: { lt: daysAgo(30) } } }),
    prisma.systemErrorLog.deleteMany({ where: { createdAt: { lt: daysAgo(90) } } }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: daysAgo(365) } } }),
    prisma.clientDevice.deleteMany({ where: { revokedAt: { lt: daysAgo(90) } } }),
  ]);

  return {
    idempotencyRecordsDeleted: idempotency.count,
    rateLimitEventsDeleted: rateLimits.count,
    sessionRevocationsDeleted: sessionRevocations.count,
    loginAttemptsDeleted: loginAttempts.count,
    apiFailuresDeleted: apiFailures.count,
    systemErrorsDeleted: systemErrors.count,
    auditLogsDeleted: auditLogs.count,
    revokedDevicesDeleted: revokedDevices.count,
    completedAt: now.toISOString(),
  };
}
