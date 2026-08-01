import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/security/rate-limit";

async function POSTHandler(request: Request) {
  const current = await getApiUser();
  if (!current) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const limited = await consumeRateLimit({ scope: "change-password", key: current.id, limit: 5, windowSeconds: 3600 });
  if (!limited.allowed) return NextResponse.json({ error: "Çok fazla deneme. Daha sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  const body = await request.json() as { currentPassword?: string; newPassword?: string };
  const user = await prisma.user.findUnique({ where: { id: current.id }, select: { passwordHash: true } });
  if (!user?.passwordHash) return NextResponse.json({ error: "Bu hesap harici giriş sağlayıcısıyla oluşturulmuş." }, { status: 400 });
  if (!await verifyPassword(String(body.currentPassword ?? ""), user.passwordHash)) return NextResponse.json({ error: "Mevcut şifre yanlış." }, { status: 400 });
  const error = validatePassword(String(body.newPassword ?? ""));
  if (error) return NextResponse.json({ error }, { status: 400 });
  await prisma.user.update({ where: { id: current.id }, data: { passwordHash: await hashPassword(String(body.newPassword)) } });
  await prisma.session.deleteMany({ where: { userId: current.id } });
  return NextResponse.json({ ok: true });
}

export const POST = withApiMonitoring("/api/account/password", POSTHandler);
