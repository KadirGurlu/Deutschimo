import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const adminRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const editorRoles = new Set(["EDITOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);

async function currentDatabaseUser() {
  const session = await auth();
  if (!session?.user.id || session.user.status === "SUSPENDED") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id:true,email:true,name:true,firstName:true,lastName:true,role:true,status:true,currentLevel:true,targetLevel:true,dailyGoalMinutes:true,onboardingCompleted:true,image:true },
  });
  if (!user || user.status === "SUSPENDED") return null;
  return { ...session.user, ...user };
}

export async function requireUser() {
  const user = await currentDatabaseUser();
  if (!user) redirect("/auth");
  return { user };
}

export async function requireOnboardedUser() {
  const session = await requireUser();
  if (!session.user.onboardingCompleted) redirect("/onboarding");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!adminRoles.has(session.user.role)) redirect("/dashboard");
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
