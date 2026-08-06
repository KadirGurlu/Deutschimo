import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { revokeUserSessions } from "@/lib/auth/session-revocation";
import { writeAuditLog } from "@/lib/security/audit";

async function POSTHandler(request: Request) {
  const limited = await consumeRateLimit({ scope: "password-reset-submit", key: getClientIp(request), limit: 10, windowSeconds: 3600 });
  if (!limited.allowed) return NextResponse.json({ error: "Çok fazla deneme. Daha sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });

  const body = await request.json() as { token?: string; password?: string };
  const tokenValue = String(body.token ?? "");
  const password = String(body.password ?? "");
  const passwordError = validatePassword(password);
  if (!tokenValue || passwordError) return NextResponse.json({ error: passwordError ?? "Bağlantı geçersiz." }, { status: 400 });

  const tokenHash = hashToken(tokenValue);
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, usedAt: true, expiresAt: true } });
  if (!token || token.usedAt || token.expiresAt < new Date()) return NextResponse.json({ error: "Şifre yenileme bağlantısının süresi dolmuş veya bağlantı geçersiz." }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const updated = await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: token.userId }, data: { passwordHash, status: "ACTIVE" } });
    await tx.passwordResetToken.updateMany({ where: { userId: token.userId, usedAt: null }, data: { usedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: token.userId } });
    return true;
  });

  if (!updated) return NextResponse.json({ error: "Şifre yenileme bağlantısı daha önce kullanılmış." }, { status: 400 });
  await Promise.all([
    revokeUserSessions(token.userId),
    writeAuditLog({ actorUserId: token.userId, action: "ACCOUNT_PASSWORD_RESET", entityType: "User", entityId: token.userId, summary: "Şifre yenileme bağlantısıyla şifre değiştirildi ve oturumlar iptal edildi." }),
  ]);
  return NextResponse.json({ ok: true });
}

export const POST = withApiMonitoring("/api/auth/reset-password", POSTHandler, { maxBodyBytes: 16 * 1024 });
