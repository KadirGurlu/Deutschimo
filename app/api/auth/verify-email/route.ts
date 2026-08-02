import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

async function POSTHandler(request: Request) {
  const limited = await consumeRateLimit({ scope: "verify-email", key: getClientIp(request), limit: 20, windowSeconds: 3600 });
  if (!limited.allowed) return NextResponse.json({ error: "Çok fazla doğrulama denemesi." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });

  const body = await request.json() as { token?: string };
  if (!body.token) return NextResponse.json({ error: "Doğrulama bağlantısı geçersiz." }, { status: 400 });
  const token = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(body.token) }, select: { id: true, userId: true, expiresAt: true } });
  if (!token || token.expiresAt < new Date()) return NextResponse.json({ error: "Doğrulama bağlantısının süresi dolmuş veya bağlantı geçersiz." }, { status: 400 });

  const verified = await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.deleteMany({ where: { id: token.id, expiresAt: { gt: new Date() } } });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: token.userId }, data: { emailVerified: new Date(), status: "ACTIVE" } });
    await tx.emailVerificationToken.deleteMany({ where: { userId: token.userId } });
    return true;
  });

  if (!verified) return NextResponse.json({ error: "Doğrulama bağlantısı daha önce kullanılmış." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export const POST = withApiMonitoring("/api/auth/verify-email", POSTHandler, { maxBodyBytes: 8 * 1024 });
