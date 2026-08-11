import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/v47/api";
import { databaseReadiness } from "@/lib/v47/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!sessionUserId) return apiError("UNAUTHENTICATED", "Authentication required.", { status: 401 });

  const actor = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, status: true },
  });
  if (!actor || actor.status === "SUSPENDED" || !["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    return apiError("FORBIDDEN", "Admin access required.", { status: 403 });
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalUsers, newUsers24h, activeLearners7d, lessons24h, plans24h, reportsOpen, health] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      prisma.productAnalyticsEvent.groupBy({
        by: ["userId"],
        where: { userId: { not: null }, occurredAt: { gte: since7d } },
      }).then((rows) => rows.length),
      prisma.productAnalyticsEvent.count({ where: { event: "lesson_completed", occurredAt: { gte: since24h } } }),
      prisma.productAnalyticsEvent.count({ where: { event: "daily_plan_completed", occurredAt: { gte: since24h } } }),
      prisma.userFeedback.count({ where: { status: "OPEN" } }),
      databaseReadiness(),
    ]);

  return apiOk({
    totalUsers,
    newUsers24h,
    activeLearners7d,
    lessonsCompleted24h: lessons24h,
    dailyPlansCompleted24h: plans24h,
    openFeedback: reportsOpen,
    systemStatus: health.reachable ? "healthy" : "degraded",
    generatedAt: new Date().toISOString(),
  });
}
