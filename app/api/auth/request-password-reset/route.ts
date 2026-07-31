import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const generic = { ok: true, message: "Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi." };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.email || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json(generic);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const rawToken = createSecureToken();
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;
  await sendTransactionalEmail({
    to: user.email,
    subject: "Deutschimo şifreni yenile",
    html: `<p>Şifreni yenilemek için aşağıdaki bağlantıyı kullan:</p><p><a href="${resetUrl}">Yeni şifre oluştur</a></p><p>Bağlantı 1 saat geçerlidir.</p>`,
  });
  return NextResponse.json(generic);
}
