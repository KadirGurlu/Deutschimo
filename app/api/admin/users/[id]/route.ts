import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";
import type { Level, UserRole, UserStatus } from "@prisma/client";

const roles = new Set(["STUDENT", "INSTRUCTOR", "EDITOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);
const statuses = new Set(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]);
const levels = new Set(["A1", "A2", "B1", "B2"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getApiUser();
  if (!currentUser || !isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  if (id === currentUser.id && body.status === "SUSPENDED") return NextResponse.json({ error: "Kendi hesabını askıya alamazsın." }, { status: 400 });

  const data: { role?: UserRole; status?: UserStatus; currentLevel?: Level; targetLevel?: Level } = {};
  if (roles.has(String(body.role))) data.role = String(body.role) as UserRole;
  if (statuses.has(String(body.status))) data.status = String(body.status) as UserStatus;
  if (levels.has(String(body.currentLevel))) data.currentLevel = String(body.currentLevel) as Level;
  if (levels.has(String(body.targetLevel))) data.targetLevel = String(body.targetLevel) as Level;
  if (!Object.keys(data).length) return NextResponse.json({ error: "Güncellenecek geçerli bir alan bulunamadı." }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data, select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, currentLevel: true, targetLevel: true, createdAt: true, lastSeenAt: true, emailVerified: true } });
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getApiUser();
  if (!currentUser || !isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  const { id } = await context.params;
  if (id === currentUser.id) return NextResponse.json({ error: "Kendi hesabını silemezsin." }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
