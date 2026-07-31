import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const body = await request.json() as { token?: string };
  if (!body.token) return NextResponse.json({ error: "Doğrulama bağlantısı geçersiz." }, { status: 400 });
  const token = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(body.token) } });
  if (!token || token.expiresAt < new Date()) return NextResponse.json({ error: "Doğrulama bağlantısının süresi dolmuş veya bağlantı geçersiz." }, { status: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { emailVerified: new Date(), status: "ACTIVE" } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: token.userId } }),
  ]);
  return NextResponse.json({ ok: true });
}
