import { prisma } from "@/lib/db";
import { securityHash } from "@/lib/security/request";

type LimitOptions = { scope: string; key: string; limit: number; windowSeconds: number };

export async function consumeRateLimit(options: LimitOptions) {
  const keyHash = securityHash(`${options.scope}:${options.key}`);
  const since = new Date(Date.now() - options.windowSeconds * 1000);
  const count = await prisma.rateLimitEvent.count({ where: { scope: options.scope, keyHash, createdAt: { gte: since } } });
  if (count >= options.limit) {
    const oldest = await prisma.rateLimitEvent.findFirst({ where: { scope: options.scope, keyHash, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } });
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(((oldest?.createdAt.getTime() ?? Date.now()) + options.windowSeconds * 1000 - Date.now()) / 1000)) };
  }
  await prisma.rateLimitEvent.create({ data: { scope: options.scope, keyHash } });
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkLoginLimit(email: string, ip: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const emailHash = securityHash(email.toLowerCase());
  const ipHash = securityHash(ip);
  const [emailFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({ where: { emailHash, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { ipHash, success: false, createdAt: { gte: since } } }),
  ]);
  return { allowed: emailFailures < 5 && ipFailures < 20, emailHash, ipHash };
}

export async function recordLoginAttempt(input: { emailHash: string; ipHash: string; success: boolean; reason?: string }) {
  await prisma.loginAttempt.create({ data: input });
}
