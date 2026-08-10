import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// V46.5 AUTHORIZATION & SECURITY BOUNDARIES
// V46.5.1 preserves the pre-existing onboarding authorization contract.
// Server-side helpers are the source of truth. UI visibility is never treated as authorization.
const adminRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const editorRoles = new Set(["EDITOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);
const nonPrivilegedAssignableRoles = new Set(["STUDENT", "INSTRUCTOR", "EDITOR", "MODERATOR"]);

async function currentDatabaseUser() {
  const session = await auth();
  if (!session?.user.id || session.user.status === "SUSPENDED") return null;

  // Re-read authorization-sensitive fields from the database so revoked/suspended users
  // are not trusted only because an older session/JWT still exists.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      currentLevel: true,
      targetLevel: true,
      dailyGoalMinutes: true,
      onboardingCompleted: true,
      image: true,
    },
  });

  if (!user || user.status === "SUSPENDED") return null;
  return { ...session.user, ...user };
}

export async function requireUser() {
  const user = await currentDatabaseUser();
  if (!user) redirect("/auth");
  return { user };
}

// Kept from the pre-V46.5 authorization API because dashboard and other protected
// learner pages rely on this server-side onboarding boundary.
export async function requireOnboardedUser() {
  const session = await requireUser();
  if (!session.user.onboardingCompleted) redirect("/onboarding");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!isAdminRole(session.user.role)) redirect("/dashboard");
  return session;
}

export async function requireEditor() {
  const session = await requireUser();
  if (!editorRoles.has(session.user.role)) redirect("/dashboard");
  return session;
}

export async function getApiUser() {
  return currentDatabaseUser();
}

export function isAdminRole(role?: string) {
  return Boolean(role && adminRoles.has(role));
}

export function isSuperAdminRole(role?: string) {
  return role === "SUPER_ADMIN";
}

/**
 * Least-privilege rule for managing another user:
 * - SUPER_ADMIN can manage any other account (self-protection is handled by the route).
 * - ADMIN can manage only non-privileged accounts.
 * - Everybody else is denied.
 */
export function canAdminManageTarget(actorRole?: string, targetRole?: string) {
  if (isSuperAdminRole(actorRole)) return true;
  if (actorRole !== "ADMIN") return false;
  return !isAdminRole(targetRole);
}

/**
 * Least-privilege role assignment:
 * - SUPER_ADMIN may assign any supported role.
 * - ADMIN may assign only non-privileged roles and can never mint ADMIN/SUPER_ADMIN.
 */
export function canAssignRole(actorRole?: string, targetRole?: string) {
  if (!targetRole) return false;
  if (isSuperAdminRole(actorRole)) return true;
  if (actorRole !== "ADMIN") return false;
  return nonPrivilegedAssignableRoles.has(targetRole);
}
