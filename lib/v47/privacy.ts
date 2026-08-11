import { prisma } from "@/lib/db";

export async function getPrivacyExport(userId: string) {
  const [profile, consent, events, feedback] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
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
        image: true,
      },
    }),
    prisma.userConsent.findUnique({ where: { userId } }),
    prisma.productAnalyticsEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 5000,
      select: { event: true, occurredAt: true, route: true, durationMs: true, metadata: true },
    }),
    prisma.userFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { category: true, route: true, comment: true, createdAt: true, status: true },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    profile,
    privacy: consent,
    analytics: events,
    feedback,
    note:
      "V47 export foundation covers account profile and V47 operational data. Existing learning-domain export remains model-specific and must be expanded before a formal legal export guarantee.",
  };
}
