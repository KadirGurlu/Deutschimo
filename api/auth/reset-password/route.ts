import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword, validatePassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const body = await request.json() as { token?: string; password?: string };
  const tokenValue = String(body.token ?? "");
  const password = String(body.password ?? "");
  const passwordError = validatePassword(password);
  if (!tokenValue || passwordError) return NextResponse.json({ error: passwordError ?? "Bağlantı geçersiz." }, { status: 400 });

  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(tokenValue) } });
  if (!token || token.usedAt || token.expiresAt < new Date()) return NextResponse.json({ error: "Şifre yenileme bağlantısının süresi dolmuş veya bağlantı geçersiz." }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { passwordHash: await hashPassword(password), status: "ACTIVE" } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
