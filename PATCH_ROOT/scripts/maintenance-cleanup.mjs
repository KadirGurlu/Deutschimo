import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });
const now = new Date();
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000);

try {
  const results = await prisma.$transaction([
    prisma.apiIdempotencyRecord.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimitEvent.deleteMany({ where: { scope: { not: "session-revocation" }, createdAt: { lt: daysAgo(2) } } }),
    prisma.rateLimitEvent.deleteMany({ where: { scope: "session-revocation", createdAt: { lt: daysAgo(35) } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: daysAgo(90) } } }),
    prisma.apiFailureLog.deleteMany({ where: { createdAt: { lt: daysAgo(30) } } }),
    prisma.systemErrorLog.deleteMany({ where: { createdAt: { lt: daysAgo(90) } } }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: daysAgo(365) } } }),
    prisma.clientDevice.deleteMany({ where: { revokedAt: { lt: daysAgo(90) } } }),
  ]);
  console.log(JSON.stringify({
    idempotencyRecordsDeleted: results[0].count,
    rateLimitEventsDeleted: results[1].count,
    sessionRevocationsDeleted: results[2].count,
    loginAttemptsDeleted: results[3].count,
    apiFailuresDeleted: results[4].count,
    systemErrorsDeleted: results[5].count,
    auditLogsDeleted: results[6].count,
    revokedDevicesDeleted: results[7].count,
    completedAt: now.toISOString(),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
