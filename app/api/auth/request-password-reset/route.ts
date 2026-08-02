import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { escapeHtml } from "@/lib/email/html";

async function POSTHandler(request: Request) {
  const limited = await consumeRateLimit({ scope: "password-reset-request", key: getClientIp(request), limit: 5, windowSeconds: 3600 });
  if (!limited.allowed) return NextResponse.json({ ok: true, message: "Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi." });
  const body = await request.json() as { email?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const generic = { ok: true, message: "Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi." };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user?.email || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json(generic);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const rawToken = createSecureToken();
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendTransactionalEmail({
    to: user.email,
    subject: "Deutschimo şifreni yenile",
    html: `<p>Şifreni yenilemek için aşağıdaki bağlantıyı kullan:</p><p><a href="${escapeHtml(resetUrl)}">Yeni şifre oluştur</a></p><p>Bağlantı 1 saat geçerlidir.</p>`,
  });
  return NextResponse.json(generic);
}

export const POST = withApiMonitoring("/api/auth/request-password-reset", POSTHandler, { maxBodyBytes: 8 * 1024 });
