import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  canAdminManageTarget,
  canAssignRole,
  getApiUser,
  isAdminRole,
} from "@/lib/auth/authorization";
import type { Level, UserRole, UserStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/security/audit";
import { requestSecurityContext } from "@/lib/security/request";

// V46.5 LEAST-PRIVILEGE ADMIN BOUNDARY
const roles = new Set(["STUDENT", "INSTRUCTOR", "EDITOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);
const statuses = new Set(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]);
const levels = new Set(["A1", "A2", "B1", "B2"]);

async function PATCHHandler(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  if (!isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });

  const { id } = await context.params;
  const before = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true, currentLevel: true, targetLevel: true, isTestUser: true },
  });
  if (!before) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  // ADMIN cannot modify another ADMIN/SUPER_ADMIN. SUPER_ADMIN may manage privileged targets.
  if (id !== currentUser.id && !canAdminManageTarget(currentUser.role, before.role)) {
    return NextResponse.json({ error: "Bu kullanıcı üzerinde işlem yapma yetkin yok." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  if (id === currentUser.id && body.status === "SUSPENDED") {
    return NextResponse.json({ error: "Kendi hesabını askıya alamazsın." }, { status: 400 });
  }

  const data: {
    role?: UserRole;
    status?: UserStatus;
    currentLevel?: Level;
    targetLevel?: Level;
    isTestUser?: boolean;
  } = {};

  if (roles.has(String(body.role))) {
    const requestedRole = String(body.role) as UserRole;
    if (requestedRole !== before.role) {
      if (id === currentUser.id) {
        return NextResponse.json({ error: "Kendi rolünü değiştiremezsin." }, { status: 400 });
      }
      if (!canAssignRole(currentUser.role, requestedRole)) {
        return NextResponse.json(
          { error: "Bu rolü atama yetkin yok. ADMIN/SUPER_ADMIN yetkisi yalnızca izin verilen hiyerarşi içinde atanabilir." },
          { status: 403 },
        );
      }
      data.role = requestedRole;
    }
  }

  if (statuses.has(String(body.status))) data.status = String(body.status) as UserStatus;
  if (levels.has(String(body.currentLevel))) data.currentLevel = String(body.currentLevel) as Level;
  if (levels.has(String(body.targetLevel))) data.targetLevel = String(body.targetLevel) as Level;
  if (typeof body.isTestUser === "boolean") data.isTestUser = body.isTestUser;

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Güncellenecek geçerli bir alan bulunamadı." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      currentLevel: true,
      targetLevel: true,
      createdAt: true,
      lastSeenAt: true,
      emailVerified: true,
      isTestUser: true,
    },
  });

  const contextData = requestSecurityContext(request);
  await writeAuditLog({
    actorUserId: currentUser.id,
    actorEmail: currentUser.email,
    action: "ADMIN_USER_UPDATE",
    entityType: "User",
    entityId: id,
    summary: `${currentUser.firstName ?? currentUser.email ?? "Yönetici"}, kullanıcının hesap bilgilerini güncelledi.`,
    before,
    after: user,
    ipHash: contextData.ipHash,
  });

  return NextResponse.json({ user });
}

async function DELETEHandler(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  if (!isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });

  const { id } = await context.params;
  if (id === currentUser.id) return NextResponse.json({ error: "Kendi hesabını silemezsin." }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true, isTestUser: true },
  });
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  if (!canAdminManageTarget(currentUser.role, target.role)) {
    return NextResponse.json({ error: "Bu kullanıcıyı silme yetkin yok." }, { status: 403 });
  }

  const contextData = requestSecurityContext(request);
  await writeAuditLog({
    actorUserId: currentUser.id,
    actorEmail: currentUser.email,
    action: "ADMIN_USER_DELETE",
    entityType: "User",
    entityId: id,
    summary: `${currentUser.firstName ?? currentUser.email ?? "Yönetici"}, bir kullanıcı hesabını ve öğrenme verilerini sildi.`,
    before: target,
    ipHash: contextData.ipHash,
  });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = withApiMonitoring("/api/admin/users/[id]", PATCHHandler);
export const DELETE = withApiMonitoring("/api/admin/users/[id]", DELETEHandler);
