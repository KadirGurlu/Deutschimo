import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";

export async function GET() {
  const currentUser = await getApiUser();
  if (!currentUser || !isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [users, activeUsers, newUsers, completedUnits, activityEvents] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: thirtyDaysAgo }, status: "ACTIVE" } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.userUnitProgress.count({ where: { status: "COMPLETED" } }),
    prisma.userActivityEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);
  return NextResponse.json({ users, activeUsers, newUsers, completedUnits, activityEvents });
}
