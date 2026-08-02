import { prisma } from "@/lib/db";
import { securityHash } from "@/lib/security/request";

const scope = "session-revocation";

function keyHash(userId: string) {
  return securityHash(`session:${userId}`);
}

export async function revokeUserSessions(userId: string) {
  return prisma.rateLimitEvent.create({ data: { scope, keyHash: keyHash(userId) } });
}

export async function isSessionRevoked(userId: string, authenticatedAt: number) {
  const latest = await prisma.rateLimitEvent.findFirst({
    where: { scope, keyHash: keyHash(userId) },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return Boolean(latest && latest.createdAt.getTime() > authenticatedAt);
}
