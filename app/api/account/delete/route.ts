import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { securityHash } from "@/lib/security/request";
import { writeAuditLog } from "@/lib/security/audit";

async function POSTHandler(request: Request) {
  const current = await getApiUser();
  if (!current) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { confirmation?: string; password?: string };
  if (String(body.confirmation ?? "").trim().toLocaleUpperCase("tr-TR") !== "HESABIMI SİL") return NextResponse.json({ error: "Onay alanına HESABIMI SİL yaz." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: current.id }, select: { id: true, email: true, passwordHash: true, role: true } });
  if (!user) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Yönetici hesabı bu ekrandan silinemez." }, { status: 400 });
  if (user.passwordHash && !await verifyPassword(String(body.password ?? ""), user.passwordHash)) return NextResponse.json({ error: "Şifre yanlış." }, { status: 400 });
  await writeAuditLog({ actorUserId: user.id, actorEmail: user.email, action: "ACCOUNT_SELF_DELETE", entityType: "User", entityId: user.id, summary: "Kullanıcı kendi hesabını ve öğrenme verilerini sildi." });
  await prisma.$transaction(async (tx) => {
    await tx.accountDeletionLog.create({ data: { userIdHash: securityHash(user.id), emailHash: user.email ? securityHash(user.email) : null, deletionType: "SELF_SERVICE", completedAt: new Date() } });
    await tx.user.delete({ where: { id: user.id } });
  });
  return NextResponse.json({ ok: true });
}

export const POST = withApiMonitoring("/api/account/delete", POSTHandler);
